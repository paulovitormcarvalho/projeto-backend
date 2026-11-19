class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendError(res, error, context = 'Operação') {
  const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error instanceof UniqueConstraintError) {
    return res.status(409).json({ message: 'Já existe um registro com um valor único informado.' });
  }
  if (error instanceof ForeignKeyConstraintError) {
    return res.status(409).json({ message: 'O registro possui vínculos que impedem esta operação.' });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }
  console.error(`${context}:`, error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

function positiveId(value, field = 'ID') {
  const str = String(value ?? '');
  if (!/^[1-9]\d*$/.test(str) || !Number.isSafeInteger(Number(str))) {
    throw new HttpError(400, `${field} inválido.`);
  }
  return Number(str);
}

function idArray(value, field = 'IDs') {
  if (!Array.isArray(value)) throw new HttpError(400, `${field} deve ser uma lista.`);
  const ids = value.map((item) => positiveId(item, field));
  if (new Set(ids).size !== ids.length) throw new HttpError(400, `${field} não aceita repetições.`);
  return ids;
}

module.exports = { HttpError, sendError, positiveId, idArray };
