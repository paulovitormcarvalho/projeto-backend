const { Op } = require('sequelize');
const { sequelize, Product, ProductImage, ProductOption, Category, ProductCategory } = require('../models');
const { HttpError, sendError, positiveId } = require('../utils/http');
const {
  productColumns, parseProduct, parseOption, parseImage,
  parsePagination, parseFilterIds, parseFields, parseList,
} = require('../services/productInput');
const { storeImage, removeLocalImage } = require('../services/imageStorage');

const relations = [
  { association: 'images' },
  { association: 'options' },
  { association: 'categories', through: { attributes: [] } },
];

async function getProduct(id, transaction) {
  return Product.findByPk(id, { include: relations, transaction });
}

async function find(req, res) {
  try {
    const id = positiveId(req.params.id);
    const product = await getProduct(id);
    if (!product) throw new HttpError(404, 'Produto não encontrado.');
    return res.status(200).json({ data: product });
  } catch (error) { return sendError(res, error, 'Erro ao buscar produto'); }
}

function parsePriceRange(value) {
  if (value === undefined) return null;
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?-\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new HttpError(400, 'price-range deve seguir o formato minimo-maximo, ex.: 50-200.');
  }
  const [min, max] = value.split('-').map(Number);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
    throw new HttpError(400, 'Intervalo de preço inválido.');
  }
  return [min, max];
}

function optionCriteria(query) {
  const parsed = [];
  for (const [key, value] of Object.entries(query)) {
    const match = /^option\[([1-9]\d*)\]$/.exec(key);
    if (!match) continue;
    parsed.push({ id: positiveId(match[1], 'option'), values: parseList(value, key) });
  }
  return parsed;
}

async function matchingIdsByOptions(filters) {
  if (!filters.length) return null;
  const ids = [...new Set(filters.map((x) => x.id))];
  const existing = await ProductOption.findAll({ where: { id: { [Op.in]: ids } } });
  const found = new Map(existing.map((opt) => [opt.id, opt]));
  let validProduct = null;
  for (const filter of filters) {
    const option = found.get(filter.id);
    if (!option || !Array.isArray(option.values)) return [];
    if (!filter.values.some((value) => option.values.includes(value))) return [];
    if (validProduct === null) validProduct = option.product_id;
    else if (validProduct !== option.product_id) return [];
  }
  return validProduct === null ? [] : [validProduct];
}

async function search(req, res) {
  try {
    const { limit, page } = parsePagination(req.query);
    const fields = parseFields(req.query.fields);
    const where = {};

    if (req.query.match !== undefined) {
      if (typeof req.query.match !== 'string' || !req.query.match.trim() || req.query.match.length > 200) {
        throw new HttpError(400, 'match deve ser um texto preenchido de até 200 caracteres.');
      }
      const match = req.query.match.trim();
      where[Op.or] = [
        { name: { [Op.like]: `%${match}%` } },
        { description: { [Op.like]: `%${match}%` } },
      ];
    }

    const price = parsePriceRange(req.query['price-range']);
    if (price) where.price_with_discount = { [Op.between]: price };

    const categoryIds = parseFilterIds(req.query.category_ids, 'category_ids');
    let matchedIds = null;
    if (categoryIds.length) {
      const links = await ProductCategory.findAll({
        where: { category_id: { [Op.in]: categoryIds } },
        attributes: ['product_id'],
      });
      matchedIds = new Set(links.map((link) => link.product_id));
    }
    const optionIds = await matchingIdsByOptions(optionCriteria(req.query));
    if (optionIds !== null) {
      const optionSet = new Set(optionIds);
      matchedIds = matchedIds === null ? optionSet : new Set([...matchedIds].filter((id) => optionSet.has(id)));
    }
    if (matchedIds !== null) where.id = { [Op.in]: [...matchedIds] };

    // Pagina pelo produto, sem multiplicar linhas por imagens ou categorias.
    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      ...(limit === -1 ? {} : { limit, offset: (page - 1) * limit }),
    });
    const productIds = rows.map((item) => item.id);
    const images = productIds.length ? await ProductImage.findAll({
      where: { product_id: { [Op.in]: productIds } },
      order: [['id', 'ASC']],
    }) : [];
    const imageMap = new Map();
    for (const image of images) {
      if (!imageMap.has(image.product_id)) imageMap.set(image.product_id, []);
      imageMap.get(image.product_id).push({ id: image.id, enabled: image.enabled, path: image.path });
    }

    const data = rows.map((instance) => {
      const product = instance.get({ plain: true });
      if (fields) {
        const result = {};
        for (const field of fields) result[field] = product[field];
        return result;
      }
      return { ...product, images: imageMap.get(product.id) ?? [] };
    });
    return res.status(200).json({ data, total: count, limit, page });
  } catch (error) { return sendError(res, error, 'Erro ao pesquisar produtos'); }
}

async function validateCategories(ids, transaction) {
  if (ids === undefined || !ids.length) return;
  const count = await Category.count({ where: { id: { [Op.in]: ids } }, transaction });
  if (count !== ids.length) throw new HttpError(400, 'Uma ou mais categorias não existem.');
}

async function reconcileImages(product, items, transaction, writtenPaths, deletedPaths) {
  if (items === undefined) return;
  const seen = new Set();
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new HttpError(400, 'Imagem inválida.');
    if (item.id !== undefined) {
      const id = positiveId(item.id, 'ID da imagem');
      if (seen.has(id)) throw new HttpError(400, 'ID de imagem repetido.');
      seen.add(id);
      const image = await ProductImage.findOne({ where: { id, product_id: product.id }, transaction });
      if (!image) throw new HttpError(400, 'Imagem não pertence a este produto.');
      if (item.deleted === true) {
        await image.destroy({ transaction });
        deletedPaths.push(image.path);
        continue;
      }
      if (item.deleted !== undefined && item.deleted !== false) throw new HttpError(400, 'deleted deve ser booleano.');
      const updated = parseImage(item, true);
      if (updated.path) {
        const nextPath = await storeImage(updated.path, updated.type, writtenPaths);
        if (nextPath !== image.path) deletedPaths.push(image.path);
        updated.path = nextPath;
      }
      delete updated.type;
      await image.update(updated, { transaction });
    } else {
      if (item.deleted !== undefined) throw new HttpError(400, 'deleted exige o ID de uma imagem existente.');
      const added = parseImage(item, false);
      const imagePath = await storeImage(added.path, added.type, writtenPaths);
      await ProductImage.create({ product_id: product.id, path: imagePath, enabled: added.enabled }, { transaction });
    }
  }
}

async function reconcileOptions(product, items, transaction) {
  if (items === undefined) return;
  const seen = new Set();
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new HttpError(400, 'Opção inválida.');
    if (item.id !== undefined) {
      const id = positiveId(item.id, 'ID da opção');
      if (seen.has(id)) throw new HttpError(400, 'ID de opção repetido.');
      seen.add(id);
      const option = await ProductOption.findOne({ where: { id, product_id: product.id }, transaction });
      if (!option) throw new HttpError(400, 'Opção não pertence a este produto.');
      if (item.deleted === true) { await option.destroy({ transaction }); continue; }
      if (item.deleted !== undefined && item.deleted !== false) throw new HttpError(400, 'deleted deve ser booleano.');
      const updated = parseOption(item, true);
      await option.update(updated, { transaction });
    } else {
      if (item.deleted !== undefined) throw new HttpError(400, 'deleted exige o ID de uma opção existente.');
      const added = parseOption(item, false);
      await ProductOption.create({ ...added, product_id: product.id }, { transaction });
    }
  }
}

async function persist(req, res, isUpdate) {
  const writtenPaths = [];
  const deletedPaths = [];
  try {
    const input = parseProduct(req.body, isUpdate);
    const id = isUpdate ? positiveId(req.params.id) : null;
    let productId;
    await sequelize.transaction(async (transaction) => {
      const { category_ids, images, options, ...columns } = input;
      let product;
      if (isUpdate) {
        product = await Product.findByPk(id, { transaction });
        if (!product) throw new HttpError(404, 'Produto não encontrado.');
        const finalPrice = columns.price ?? Number(product.price);
        const finalDiscount = columns.price_with_discount ?? Number(product.price_with_discount);
        if (finalDiscount > finalPrice) throw new HttpError(400, 'price_with_discount não pode ser maior que price.');
        await product.update(columns, { transaction });
      } else {
        if (columns.price_with_discount > columns.price) {
          throw new HttpError(400, 'price_with_discount não pode ser maior que price.');
        }
        product = await Product.create(columns, { transaction });
      }
      productId = product.id;
      await validateCategories(category_ids, transaction);
      if (category_ids !== undefined) await product.setCategories(category_ids, { transaction });
      await reconcileImages(product, images, transaction, writtenPaths, deletedPaths);
      await reconcileOptions(product, options, transaction);
    });

    for (const imagePath of deletedPaths) await removeLocalImage(imagePath);
    const data = await getProduct(productId);
    return res.status(isUpdate ? 200 : 201).json({ data });
  } catch (error) {
    await Promise.all(writtenPaths.map(removeLocalImage));
    return sendError(res, error, isUpdate ? 'Erro ao atualizar produto' : 'Erro ao criar produto');
  }
}

async function create(req, res) { return persist(req, res, false); }
async function update(req, res) { return persist(req, res, true); }

async function remove(req, res) {
  try {
    const id = positiveId(req.params.id);
    const deletedPaths = [];
    await sequelize.transaction(async (transaction) => {
      const product = await Product.findByPk(id, { transaction });
      if (!product) throw new HttpError(404, 'Produto não encontrado.');
      const images = await ProductImage.findAll({ where: { product_id: id }, transaction });
      deletedPaths.push(...images.map((image) => image.path));
      await product.destroy({ transaction });
    });
    for (const imagePath of deletedPaths) await removeLocalImage(imagePath);
    return res.status(204).send();
  } catch (error) { return sendError(res, error, 'Erro ao excluir produto'); }
}

module.exports = { search, find, create, update, remove };
