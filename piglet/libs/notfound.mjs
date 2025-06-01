import { generateAppHtml } from "@Piglet/parser/page";
import { resolvePath } from "@Piglet/utils/paths";
import fs from "fs";
const notFound = async (res) => {
 const notFoundPath = resolvePath("@/builtHTML/NotFound.html");
 if (!fs.existsSync(notFoundPath)) {
 res.writeHead(404, { "Content-Type": "text/plain" });
 res.end("404 Not Found");
 return;
 }
 const html = await generateAppHtml("/notfound");
 res.writeHead(404, { "Content-Type": "text/html" });
 res.end(html);
};
export default notFound;