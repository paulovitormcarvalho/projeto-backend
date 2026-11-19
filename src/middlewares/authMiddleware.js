const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      message: "Token não informado.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Token não informado.",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET não configurada.");

    return res.status(500).json({
      message: "Erro interno do servidor.",
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    if (!/^[1-9]\d*$/.test(String(payload.sub ?? ""))) {
      return res.status(401).json({
        message: "Token inválido ou expirado.",
      });
    }

    req.userId = payload.sub;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido ou expirado.",
    });
  }
}

module.exports = authMiddleware;