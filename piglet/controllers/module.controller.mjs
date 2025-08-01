import { resolvePath } from "@Piglet/utils/paths";
import path from "path";
import CONST from "@Piglet/misc/CONST";
import fs from "fs";
import notFound from "@Piglet/libs/notfound";
export default (req, res) => {
 const pathWithoutModule = req.url
 .split("?")[0]
 .replace(`${CONST.customRouteAliases.module}/`, "");
 const filePath = resolvePath(`@/src/modules/${pathWithoutModule}.mjs`);
 const ext = path.extname(filePath);
 const contentType = CONST.mimeTypes[ext] || "application/javascript";
 fs.readFile(filePath, (err, data) => {
 if (err) {
 notFound(res);
 } else {
 res.writeHead(200, { "Content-Type": contentType });
 res.end(data);
 }
 });
};