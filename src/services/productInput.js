const { HttpError, idArray, positiveId } = require('../utils/http');

const productColumns = [
  'id', 'enabled', 'name', 'slug', 'stock', 'description',
  'price', 'price_with_discount', 'createdAt', 'updatedAt',
];

function nonEmptyText(value, field, max = 255) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpError(400, `${field} deve ser texto preenchido de até ${max} caracteres.`);
  }
  return value.trim();
}

function money(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 99999999.99) {
    throw new HttpError(400, `${field} deve ser um número positivo ou zero.`);
  }
  return Math.round(value * 100) / 100;
}

function optionalBoolean(value, field) {
  if (typeof value !== 'boolean') throw new HttpError(400, `${field} deve ser booleano.`);
  return value;
}

function parseProduct(body, isUpdate = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'O corpo deve ser um objeto JSON.');
  }
  const record = {};
  const required = ['name', 'slug', 'stock', 'description', 'price', 'price_with_discount'];
  if (!isUpdate && required.some((field) => body[field] === undefined)) {
    throw new HttpError(400, 'Campos obrigatórios: name, slug, stock, description, price, price_with_discount.');
  }
  if (body.name !== undefined) record.name = nonEmptyText(body.name, 'name');
  if (body.slug !== undefined) record.slug = nonEmptyText(body.slug, 'slug');
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.length > 65000) {
      throw new HttpError(400, 'description deve ser texto de até 65000 caracteres.');
    }
    record.description = body.description;
  }
  if (body.enabled !== undefined) record.enabled = optionalBoolean(body.enabled, 'enabled');
  if (body.stock !== undefined) {
    if (!Number.isSafeInteger(body.stock) || body.stock < 0) {
      throw new HttpError(400, 'stock deve ser um inteiro maior ou igual a zero.');
    }
    record.stock = body.stock;
  }
  if (body.price !== undefined) record.price = money(body.price, 'price');
  if (body.price_with_discount !== undefined) {
    record.price_with_discount = money(body.price_with_discount, 'price_with_discount');
  }
  if (body.category_ids !== undefined) {
    record.category_ids = idArray(body.category_ids, 'category_ids');
  }
  if (body.images !== undefined) {
    if (!Array.isArray(body.images) || body.images.length > 20) {
      throw new HttpError(400, 'images deve ser uma lista com até 20 imagens.');
    }
    record.images = body.images;
  }
  if (body.options !== undefined) {
    if (!Array.isArray(body.options) || body.options.length > 30) {
      throw new HttpError(400, 'options deve ser uma lista com até 30 opções.');
    }
    record.options = body.options;
  }
  return record;
}

function parseOption(raw, isUpdate) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400, 'Opção inválida.');
  const data = {};
  if (raw.title !== undefined) data.title = nonEmptyText(raw.title, 'title');
  if (raw.shape !== undefined) {
    if (!['square', 'circle'].includes(raw.shape)) throw new HttpError(400, 'shape deve ser square ou circle.');
    data.shape = raw.shape;
  }
  if (raw.type !== undefined) {
    if (!['text', 'color'].includes(raw.type)) throw new HttpError(400, 'type deve ser text ou color.');
    data.type = raw.type;
  }
  if (raw.radius !== undefined) {
    const val = typeof raw.radius === 'string' && /^\d+px$/.test(raw.radius)
      ? Number(raw.radius.slice(0, -2)) : raw.radius;
    if (!Number.isSafeInteger(val) || val < 0 || val > 10000) {
      throw new HttpError(400, 'radius deve ser um inteiro não negativo.');
    }
    data.radius = val;
  }
  const values = raw.values ?? raw.value;
  if (values !== undefined) {
    if (!Array.isArray(values) || values.length === 0 || values.length > 100 ||
      values.some((x) => typeof x !== 'string' || !x.trim() || x.length > 255)) {
      throw new HttpError(400, 'values deve ser uma lista não vazia de textos.');
    }
    data.values = values;
  }
  if (!isUpdate && ['title', 'shape', 'type', 'values'].some((f) => data[f] === undefined)) {
    throw new HttpError(400, 'Opção nova exige title, shape, type e values.');
  }
  if (!isUpdate && data.radius === undefined) data.radius = 0;
  return data;
}

function parseImage(raw, isUpdate) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new HttpError(400, 'Imagem inválida.');
  const result = {};
  if (raw.enabled !== undefined) result.enabled = optionalBoolean(raw.enabled, 'enabled');
  if (raw.type !== undefined) {
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'].includes(raw.type)) {
      throw new HttpError(400, 'Tipo de imagem inválido.');
    }
    result.type = raw.type;
  }
  if (raw.path !== undefined) result.path = nonEmptyText(raw.path, 'path', 6000000);
  if (!isUpdate && !result.path) throw new HttpError(400, 'Imagem nova exige path.');
  if (!isUpdate && result.enabled === undefined) result.enabled = true;
  return result;
}

function parsePagination(query) {
  const limitText = String(query.limit ?? '12');
  const pageText = String(query.page ?? '1');
  if (!/^(?:-1|\d+)$/.test(limitText) || !/^\d+$/.test(pageText)) {
    throw new HttpError(400, 'limit e page devem ser inteiros válidos.');
  }
  const limit = Number(limitText);
  const page = Number(pageText);
  if (limit !== -1 && (limit < 1 || limit > 100)) throw new HttpError(400, 'limit deve ser de 1 a 100 ou -1.');
  if (!Number.isSafeInteger(page) || page < 1) throw new HttpError(400, 'page deve ser maior ou igual a 1.');
  return { limit, page };
}

function parseList(value, name) {
  if (value === undefined) return [];
  const list = (Array.isArray(value) ? value : [value]).flatMap((x) => String(x).split(','));
  if (list.some((x) => !x.trim())) throw new HttpError(400, `${name} inválido.`);
  return list.map((x) => x.trim());
}

function parseFilterIds(value, name) {
  return [...new Set(parseList(value, name).map((id) => positiveId(id, name)))];
}

function parseFields(value, valid = productColumns) {
  if (value === undefined) return undefined;
  const fields = [...new Set(parseList(value, 'fields'))];
  if (fields.some((f) => !valid.includes(f))) throw new HttpError(400, 'fields contém campos inválidos.');
  return fields;
}

module.exports = {
  productColumns, parseProduct, parseImage, parseOption,
  parsePagination, parseFilterIds, parseFields, parseList,
};
