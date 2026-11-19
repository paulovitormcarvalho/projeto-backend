const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { HttpError } = require('../utils/http');

const mediaDirectory = path.join(__dirname, '..', '..', 'public', 'media');
const maxBytes = 4 * 1024 * 1024;

function inspect(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return ['image/png', 'png'];
  if (bytes.length >= 3 && bytes.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'))) return ['image/jpeg', 'jpg'];
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return ['image/webp', 'webp'];
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) return ['image/gif', 'gif'];
  throw new HttpError(400, 'O arquivo enviado não é uma imagem PNG, JPEG, WEBP ou GIF válida.');
}

async function storeImage(pathValue, type, writtenPaths) {
  if (/^https:\/\//i.test(pathValue)) {
    try {
      const url = new URL(pathValue);
      if (url.username || url.password || pathValue.length > 255) throw new Error('URL inválida');
      return pathValue;
    } catch {
      throw new HttpError(400, 'URL de imagem HTTPS inválida ou longa demais.');
    }
  }

  const dataUrl = /^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/is.exec(pathValue);
  const raw = dataUrl ? dataUrl[2] : pathValue;
  if (raw.length > Math.ceil(maxBytes * 4 / 3) + 16 || !/^[a-zA-Z0-9+/]+={0,2}$/.test(raw)) {
    throw new HttpError(400, 'A imagem deve conter base64 válido de até 4 MB ou uma URL HTTPS.');
  }
  const bytes = Buffer.from(raw, 'base64');
  if (!bytes.length || bytes.length > maxBytes) throw new HttpError(400, 'Imagem inválida ou maior que 4 MB.');
  const [detectedType, extension] = inspect(bytes);
  const declared = (type || (dataUrl && dataUrl[1]))?.replace('image/jpg', 'image/jpeg');
  if (declared && declared !== detectedType) throw new HttpError(400, 'O tipo informado não corresponde ao conteúdo da imagem.');

  const filename = `${crypto.randomUUID()}.${extension}`;
  await fs.mkdir(mediaDirectory, { recursive: true });
  await fs.writeFile(path.join(mediaDirectory, filename), bytes, { flag: 'wx' });
  const relative = `/media/${filename}`;
  writtenPaths.push(relative);
  return relative;
}

async function removeLocalImage(imagePath) {
  if (!/^\/media\/[a-f0-9-]{36}\.(png|jpg|webp|gif)$/.test(imagePath || '')) return;
  try { await fs.unlink(path.join(mediaDirectory, path.basename(imagePath))); }
  catch (error) { if (error.code !== 'ENOENT') console.error('Falha ao remover imagem:', error); }
}

module.exports = { storeImage, removeLocalImage };
