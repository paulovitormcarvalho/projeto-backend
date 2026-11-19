const { User } = require("../models");
const { UniqueConstraintError } = require("sequelize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function find(req, res) {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "ID inválido.",
      });
    }

    if (id !== req.userId) {
      return res.status(403).json({
        message: "Você não tem permissão para acessar este usuário.",
      });
    }

    const user = await User.findByPk(id, {
      attributes: [
        "id",
        "firstname",
        "surname",
        "email",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
}

async function create(req, res) {
  try {
    const {
      firstname,
      surname,
      email,
      password,
      confirmPassword,
    } = req.body ?? {};

    if (
      typeof firstname !== "string" ||
      !firstname.trim() ||
      firstname.trim().length > 100 ||
      typeof surname !== "string" ||
      !surname.trim() ||
      surname.trim().length > 100
    ) {
      return res.status(400).json({
        message: "Nome e sobrenome são obrigatórios e devem ter até 100 caracteres.",
      });
    }

    if (
      typeof email !== "string" ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        message: "E-mail inválido.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "A confirmação de senha não corresponde à senha.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstname: firstname.trim(),
      surname: surname.trim(),
      email: email.trim().toLowerCase(),
      password: passwordHash,
    });

    return res.status(201).json({
      data: {
        id: user.id,
        firstname: user.firstname,
        surname: user.surname,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        message: "Já existe um usuário com esse e-mail.",
      });
    }

    console.error("Erro ao cadastrar usuário:", error);

    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "E-mail e senha são obrigatórios.",
      });
    }

    const user = await User.findOne({
      where: { email: email.trim().toLowerCase() },
      attributes: ["id", "email", "password"],
    });

    if (!user) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos.",
      });
    }

    const senhaCorreta = await bcrypt.compare(
      password,
      user.password
    );

    if (!senhaCorreta) {
      return res.status(401).json({
        message: "E-mail ou senha inválidos.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET não configurada.");

      return res.status(500).json({
        message: "Erro interno do servidor.",
      });
    }

    const token = jwt.sign(
      { sub: String(user.id) },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      token,
      token_type: "Bearer",
      expires_in: 3600,
    });
  } catch (error) {
    console.error("Erro ao realizar login:", error);

    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    if (id !== req.userId) {
      return res.status(403).json({
        message: "Você não tem permissão para editar este usuário.",
      });
    }

    const { firstname, surname, email, password, confirmPassword } = req.body ?? {};

    if (
      typeof firstname !== "string" ||
      !firstname.trim() ||
      firstname.trim().length > 100 ||
      typeof surname !== "string" ||
      !surname.trim() ||
      surname.trim().length > 100
    ) {
      return res.status(400).json({
        message: "Nome e sobrenome devem ter até 100 caracteres.",
      });
    }

    if (
      typeof email !== "string" ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ message: "E-mail inválido." });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        message: "A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "A confirmação de senha não corresponde à senha.",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await user.update({
      firstname: firstname.trim(),
      surname: surname.trim(),
      email: email.trim().toLowerCase(),
      password: passwordHash,
    });

    return res.status(200).json({
      data: {
        id: user.id,
        firstname: user.firstname,
        surname: user.surname,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        message: "Já existe um usuário com esse e-mail.",
      });
    }

    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "ID inválido.",
      });
    }

    if (id !== req.userId) {
      return res.status(403).json({
        message: "Você não tem permissão para excluir este usuário.",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    await user.destroy();

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);

    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }
}

module.exports = {
  find,
  create,
  login,
  update,
  remove,
};