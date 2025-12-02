/**
 * Authentication Middleware
 * Validates JWT tokens from Authorization header or cookies
 * Add this to protect routes that require authentication
 */

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

function authMiddleware(req, res, next) {
  let token;

  // 1. Authorization header
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      token = parts[1];
    }
  }

  // 2. Cookie fallback
  if (!token && req.cookies) {
    token = req.cookies.token;
  }

  if (!token)
    return res.status(401).json({ message: "Authentication token missing" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err)
      return res.status(401).json({ message: "Invalid or expired token" });
    req.userId = decoded.userId || decoded.id;
    next();
  });
}

module.exports = authMiddleware;
