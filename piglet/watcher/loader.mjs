import { pathToFileURL, fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import CONST from "../misc/CONST.mjs";
let projectRoot = path.join(
 path.dirname(fileURLToPath(import.meta.url)),
 "../../",
);
const isProd = process.env.NODE_ENV === "production";
export async function resolve(specifier, context, nextResolve) {
 if (specifier.startsWith("@/") || specifier.startsWith("@Piglet/")) {
 const modifiedSpecifier = specifier.replace(
 "@Piglet/",
 `@/${CONST.dirPath(isProd)}/`,
 );
 let targetPath = path.resolve(projectRoot, modifiedSpecifier.slice(2));
 if (!fs.existsSync(targetPath)) {
 if (fs.existsSync(targetPath + ".mjs")) {
 targetPath += ".mjs";
 } else if (fs.existsSync(path.join(targetPath, "index.mjs"))) {
 targetPath = path.join(targetPath, "index.mjs");
 }
 }
 return nextResolve(pathToFileURL(targetPath).href, context);
 }
 return nextResolve(specifier, context);
}