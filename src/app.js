require('dotenv').config();
const express = require('express');
const path = require('node:path');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const swaggerUi = require('swagger-ui-express');
const specification = require('../docs/openapi.json');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));

// CORS é configurado somente quando existe uma origem autorizada no .env.
if (process.env.CORS_ORIGIN) {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
}

app.use('/media', express.static(path.join(__dirname, '..', 'public', 'media'), {
  index: false,
  maxAge: '1d',
}));

app.use('/v1/category', categoryRoutes);
app.use('/v1/user', userRoutes);
app.use('/v1/product', productRoutes);
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', message: 'API funcionando!' }));
app.get('/openapi.json', (_req, res) => res.json(specification));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specification));

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));
app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') return res.status(413).json({ message: 'Payload grande demais.' });
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'JSON inválido.' });
  }
  console.error('Erro não tratado:', error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
});
module.exports = app;
