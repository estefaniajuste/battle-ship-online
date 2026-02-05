import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

/**
 * Middleware de protección JWT.
 * - Lee el header Authorization.
 * - Valida formato: Authorization: Bearer <token>
 * - Si no existe el header o no es Bearer + token → 401 { message: "Authorization token missing" }
 * - Si el token es inválido o expirado → 401 { message: "Invalid or expired token" }
 * - Si es válido → guarda el payload en req.user y llama a next()
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export default authMiddleware;
export { authMiddleware };
