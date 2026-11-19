const express = require('express');
const ProductController = require('../controllers/ProductController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();
router.get('/search', ProductController.search); // Antes de /:id.
router.get('/:id', ProductController.find);
router.post('/', authMiddleware, ProductController.create);
router.put('/:id', authMiddleware, ProductController.update);
router.delete('/:id', authMiddleware, ProductController.remove);
module.exports = router;
