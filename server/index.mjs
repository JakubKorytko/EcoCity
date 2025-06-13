import server from "@Piglet/libs/server";
import CONST from "@Piglet/misc/CONST";
import db from "@/server/api/db";

server.listen(CONST.PORT, () => {
  console.log("Server is ready!");
});

const forbiddenRoutes = {
  guest: ["Dashboard", "AddNewReport"],
  logged: ["SignIn", "SignUp"],
};

server.middleware((req, res) => {
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
    const session = db.activeSessions.get(sessionString);

    const isLoggedIn = !!(session && session.token);
    const routesToCheck =
      forbiddenRoutes[isLoggedIn ? "logged" : "guest"] || [];

    console.log(routesToCheck, isLoggedIn, value);

    if (routesToCheck.includes(value)) {
      res.writeHead(302, {
        Location: isLoggedIn ? "/" : "/signin",
      });
      res.end();
    }
  }
});
