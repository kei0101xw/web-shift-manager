const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_EXPIRES_IN = process.env.TOKEN_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign({ uid: user.id, isAdmin: !!user.isAdmin }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

function auth(required = true) {
  return (req, res, next) => {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (!m)
      return required
        ? res.status(401).json({ error: "unauthorized" })
        : next();
    try {
      req.auth = jwt.verify(m[1], JWT_SECRET);
      next();
    } catch {
      return res.status(401).json({ error: "invalid token" });
    }
  };
}

function requireAdmin(req, res, next) {
  if (!req.auth?.isAdmin) return res.status(403).json({ error: "forbidden" });
  next();
}

module.exports = { auth, requireAdmin, signToken };
