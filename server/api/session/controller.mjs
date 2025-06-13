import { json } from "@/server/api/helpers";
import db from "@/server/api/db";

export default async function (req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
  }

  const { token } = await json(req);

  if (!token) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Token is required." }));
  }

  const session = db.activeSessions.get(token);

  if (!session) {
    res.statusCode = 401;
    return res.end(
      JSON.stringify({ error: "Invalid or expired session token." }),
    );
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  return res.end(JSON.stringify(session));
}
