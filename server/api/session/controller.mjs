import { json } from "@/server/api/helpers";
import db from "@/server/database/db";

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

  try {
    const sessions = await db.selectWhere("activeSessions", { token });

    if (sessions.length === 0) {
      res.statusCode = 401;
      return res.end(
        JSON.stringify({ error: "Invalid or expired session token." }),
      );
    }

    const session = sessions[0];

    const userDetails = await db.selectWhere("userDetails", {
      id: session.userId,
    });
    const details = userDetails[0] || {};
    const user = {
      id: session.userId,
      email: session.email,
      name: details.name || "Unknown User",
      avatar: details.avatar || "/public/images/avatars/placeholder.png",
    };

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        token: session.token,
        user,
      }),
    );
  } catch (error) {
    console.error("Error fetching session:", error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
