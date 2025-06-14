import db from "@/server/database/db";
import { json } from "@/server/api/helpers";
import { generateToken } from "@/server/api/auth";
import { verifyPassword } from "@/server/database/password";

export default async function (req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
  }

  const { email, password } = await json(req);

  if (!email || !password) {
    res.statusCode = 400;
    return res.end(
      JSON.stringify({ error: "Email and password are required." }),
    );
  }

  try {
    const users = await db.selectWhere("users", { email });

    if (users.length === 0) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: "Invalid email or password." }));
    }

    const user = users[0];
    const isPasswordValid = verifyPassword(password, user.password);

    if (!isPasswordValid) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: "Invalid email or password." }));
    }

    const session = await generateToken(user);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify(session));
  } catch (error) {
    console.error("Error during login:", error);
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}
