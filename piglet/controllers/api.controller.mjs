import path from "path";
import fs from "fs/promises";
import { resolvePath } from "@Piglet/utils/paths";
import notFound from "@Piglet/libs/notfound";
import console from "@Piglet/utils/console";
export default async (req, res) => {
 const url = new URL(req.url, `https://${req.headers.host}`);
 const segments = url.pathname.split("?")[0]
 .replace(/^\/api\/?/, "")
 .split("/")
 .filter(Boolean);
 const controllerPath = path.join(...segments, "controller.mjs");
 const filePath = resolvePath(`@/server/api/${controllerPath}`);
 try {
 await fs.access(filePath);
 const controller = (await import(`file://${filePath}`)).default;
 if (typeof controller === "function") {
 return controller(req, res);
 } else {
 res.writeHead(500);
 res.end("Controller must export a default function");
 }
 } catch (err) {
 console.msg("server.controllerError", err);
 await notFound(res);
 }
};