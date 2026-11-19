const { Category } = require('../models');
const { Op } = require('sequelize');
const { HttpError, sendError, positiveId } = require('../utils/http');
const { parsePagination, parseFields } = require('../services/productInput');

function validate(body, isUpdate = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Corpo JSON inválido.');
  if (!isUpdate && (body.name === undefined || body.slug === undefined)) {
    throw new HttpError(400, 'name e slug são obrigatórios.');
  }
  const result = {};
  for (const field of ['name', 'slug']) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 255) {
        throw new HttpError(400, `${field} deve ser texto preenchido de até 255 caracteres.`);
      }
      result[field] = body[field].trim();
    }
  }
  if (body.use_in_menu !== undefined) {
    if (typeof body.use_in_menu !== 'boolean') throw new HttpError(400, 'use_in_menu deve ser booleano.');
    result.use_in_menu = body.use_in_menu;
  }
  return result;
}

async function search(req, res) {
  try {
    const { limit, page } = parsePagination(req.query);
    const fields = parseFields(req.query.fields, ['id', 'name', 'slug', 'use_in_menu', 'createdAt', 'updatedAt']);
    const where = {};
    if (req.query.name !== undefined) {
      if (typeof req.query.name !== 'string' || !req.query.name.trim()) throw new HttpError(400, 'Filtro name inválido.');
      where.name = { [Op.like]: `%${req.query.name.trim()}%` };
    }
    if (req.query.use_in_menu !== undefined) {
      if (!['true', 'false'].includes(req.query.use_in_menu)) throw new HttpError(400, 'use_in_menu deve ser true ou false.');
      where.use_in_menu = req.query.use_in_menu === 'true';
    }
    const { count, rows } = await Category.findAndCountAll({
      where,
      ...(fields ? { attributes: fields } : {}),
      order: [['id', 'ASC']],
      ...(limit === -1 ? {} : { limit, offset: (page - 1) * limit }),
    });
    return res.status(200).json({ data: rows, total: count, limit, page });
  } catch (error) { return sendError(res, error, 'Erro ao listar categorias'); }
}

async function find(req, res) {
  try {
    const category = await Category.findByPk(positiveId(req.params.id));
    if (!category) throw new HttpError(404, 'Categoria não encontrada.');
    return res.status(200).json({ data: category });
  } catch (error) { return sendError(res, error, 'Erro ao buscar categoria'); }
}

async function create(req, res) {
  try {
    const data = validate(req.body);
    const category = await Category.create({ ...data, use_in_menu: data.use_in_menu ?? false });
    return res.status(201).json({ data: category });
  } catch (error) { return sendError(res, error, 'Erro ao cadastrar categoria'); }
}

async function update(req, res) {
  try {
    const id = positiveId(req.params.id);
    const data = validate(req.body, true);
    const category = await Category.findByPk(id);
    if (!category) throw new HttpError(404, 'Categoria não encontrada.');
    await category.update(data);
    return res.status(200).json({ data: category });
  } catch (error) { return sendError(res, error, 'Erro ao atualizar categoria'); }
}

async function remove(req, res) {
  try {
    const category = await Category.findByPk(positiveId(req.params.id));
    if (!category) throw new HttpError(404, 'Categoria não encontrada.');
    await category.destroy();
    return res.status(204).send();
  } catch (error) { return sendError(res, error, 'Erro ao excluir categoria'); }
}

module.exports = { search, find, create, update, remove };
