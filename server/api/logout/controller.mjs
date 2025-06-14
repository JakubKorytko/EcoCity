import db from "@/server/database/db";

export default async function (req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
  }

  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Authorization header missing." }));
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Token is required." }));
  }

  try {
    const sessions = await db.selectWhere("activeSessions", { token });
    if (sessions.length === 0) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "Session not found." }));
    }

    await db.query(`DELETE FROM activeSessions WHERE token = '${token}'`);
    res.statusCode = 200;
    return res.end(JSON.stringify({ message: "Logout successful." }));
  } catch (error) {
    console.error("Error during logout:", error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
