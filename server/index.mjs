import server from "@Piglet/libs/server";
import CONST from "@Piglet/misc/CONST";
import db from "@/server/database/db";

server.listen(CONST.PORT, () => {
  console.log("Server is ready!");
});

const forbiddenRoutes = {
  guest: ["DashBoard", "AddNewReport"],
  logged: ["SignIn", "SignUp"],
};

server.middleware(async (req, res) => {
  const { type, value } = req.pigDescription ?? {};

  if (type === "Page") {
    const cookiesString = req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookiesString.split("; ").map((cookie) => {
        const [key, val] = cookie.split("=");
        return [key, decodeURIComponent(val)];
      }),
    );

    const sessionString = cookies.session || "";

    try {
      const sessions = await db.selectWhere("activeSessions", {
        token: sessionString,
      });
      const session = sessions.length > 0 ? sessions[0] : null;

      const isLoggedIn = !!(session && session.token);
      const routesToCheck =
        forbiddenRoutes[isLoggedIn ? "logged" : "guest"] || [];

      if (routesToCheck.includes(value)) {
        res.writeHead(302, {
          Location: isLoggedIn ? "/" : "/signin",
        });
        res.end();
      }
    } catch (error) {
      console.error("Error checking session:", error);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  }
});

const time = 1000 * 60 * 60;

async function clearOldSessions() {
  const oneHourAgo = Date.now() - time;

  try {
    await db.query(
      `DELETE FROM activeSessions WHERE createdAt < ${oneHourAgo}`,
    );
    console.log("Old sessions cleared successfully.");
  } catch (error) {
    console.error("Error clearing old sessions:", error);
  }
}

// Run the cleanup function every hour
setInterval(clearOldSessions, time);
