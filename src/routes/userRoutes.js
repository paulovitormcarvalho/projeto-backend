const express = require("express");
const router = express.Router();

const UserController = require("../controllers/UserController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

router.get("/:id", authMiddleware, UserController.find);

router.post("/", UserController.create);

router.post("/token", UserController.login);

router.put("/:id", authMiddleware, UserController.update);

router.delete("/:id", authMiddleware, UserController.remove);

module.exports = router;