import crypto from "crypto";
import db from "./db.mjs";

function logUser(email, password) {
  const [user] =
    db.users.filter(
      (user) => user.email === email && user.password === password,
    ) ?? [];
  if (!user) {
    return null;
  }
  const details = db.userDetails.find((user) => user.id === user.id) ?? {};
  return {
    id: user.id,
    email: user.email,
    name: details.name || "Unknown User",
    avatar: details.avatar || "/public/images/avatars/placeholder.png",
  };
}

export function generateToken(email, password) {
  const user = logUser(email, password);

  if (!user) return null;

  const token = crypto.randomBytes(16).toString("hex");
  const session = {
    userId: user.id,
    email: user.email,
    token: token,
    createdAt: Date.now(),
  };
  db.activeSessions.set(token, session);

  return {
    token: token,
    user,
  };
}

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Authorization header missing" }));
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token || !db.activeSessions.has(token)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Invalid or missing token" }));
    return;
  }

  // Attach the session to the request object
  req.session = db.activeSessions.get(token);
  next();
}
