const express = require("express");
const router = express.Router();

const CategoryController = require("../controllers/CategoryController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/search", CategoryController.search);

router.get("/:id", CategoryController.find);

router.post("/", authMiddleware, CategoryController.create);

router.put("/:id", authMiddleware, CategoryController.update);

router.delete("/:id", authMiddleware, CategoryController.remove);

module.exports = router;