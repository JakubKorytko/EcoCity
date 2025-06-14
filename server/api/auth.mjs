import crypto from "crypto";
import db from "@/server/database/db.mjs";

async function getUserDetails(user) {
  const userDetails = await db.selectWhere("userDetails", { id: user.id });
  const details = userDetails[0] || {};
  return {
    id: user.id,
    email: user.email,
    name: details.name || "Unknown User",
    avatar: details.avatar || "/public/images/avatars/placeholder.png",
  };
}

export async function generateToken(user) {
  const details = await getUserDetails(user);

  if (!details) return null;

  const token = crypto.randomBytes(16).toString("hex");
  const session = {
    userId: details.id,
    email: details.email,
    token: token,
    createdAt: Date.now(),
  };

  await db.insertInto("activeSessions", session);

  return {
    token: token,
    user: {
      ...details,
      avatar: details.avatar,
    },
  };
}

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Authorization header missing" }));
    return;
  }

  const token = authHeader.split(" ")[1];
  const sessions = await db.selectWhere("activeSessions", { token });
  if (sessions.length === 0) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: "Invalid or missing token" }));
    return;
  }

  // Attach the session to the request object
  req.session = sessions[0];
  next();
}
