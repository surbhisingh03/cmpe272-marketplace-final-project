import jwt from "jsonwebtoken";

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith("Bearer ")
      ? header.slice(7)
      : req.cookies?.token;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token =
    header && header.startsWith("Bearer ")
      ? header.slice(7)
      : req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
