import fs from "fs";
import path from "path";
import console from "@Piglet/utils/console";
import Parser from "@Piglet/parser/values";
const { routes, routeAliases } = Parser;
function findComponentFiles(dir, componentFiles = []) {
 const files = fs.readdirSync(dir, { withFileTypes: true });
 for (const file of files) {
 const filePath = path.join(dir, file.name);
 if (file.isDirectory()) {
 findComponentFiles(filePath, componentFiles);
 } else if (file.name.endsWith(".pig.html")) {
 componentFiles.push(filePath);
 }
 }
 return componentFiles;
}
export function parseRoutes(html, pagesDir) {
 const routeRegex = /<route\s+value="([^"]+)">[^<]*<(\w+) \/>[^<]*<\/route>/g;
 let match;
 const componentFiles = findComponentFiles(pagesDir);
 while ((match = routeRegex.exec(html)) !== null) {
 const pathValue = match[1];
 const componentName = match[2];
 const componentFile = componentFiles.find(
 (file) =>
 path.basename(file, ".pig.html").toLowerCase() ===
 componentName.toLowerCase(),
 );
 if (componentFile) {
 const routeAlias = path
 .basename(componentFile)
 .replace(/\.pig\.html$/, "");
 routes[pathValue] = componentFile;
 routeAliases[pathValue] = routeAlias;
 } else {
 console.msg("components.notFound", componentName);
 }
 }
}
export { routes, routeAliases };