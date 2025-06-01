import { resolvePath } from "@Piglet/utils/paths";
import path from "path";
import fs from "fs";
import {
 getContentTag,
 injectInnerHTMLToComponent,
} from "@Piglet/parser/component";
import fsp from "fs/promises";
import { formatHTML } from "@Piglet/parser/format";
let uniqueIDCounter = 0;
async function searchForLayoutFile(filePath) {
 const pagesDir = resolvePath("@/pages");
 if (!filePath.startsWith(pagesDir)) return false;
 let dirname = path.dirname(filePath);
 while (dirname.length >= pagesDir.length) {
 const layoutFilePath = path.join(dirname, "Layout.pig.html");
 if (fs.existsSync(layoutFilePath)) return layoutFilePath;
 dirname = path.dirname(dirname);
 }
 return false;
}
const getLayout = (layoutFilePath, componentName) => {
 if (!layoutFilePath || !fs.existsSync(layoutFilePath)) return;
 const layoutString = fs.readFileSync(layoutFilePath, "utf-8");
 const contentTag = getContentTag(layoutString);
 if (contentTag?.search(/<\s*AppContent\s*\/>/gm) !== -1) {
 return injectInnerHTMLToComponent(layoutString, contentTag, componentName);
 }
};
const uniqueID = () =>
 `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}${uniqueIDCounter++}`;
async function generateLayoutFile(filePath, componentName) {
 const layoutContent = await searchForLayoutFile(filePath);
 if (!layoutContent) return;
 await fsp.mkdir(resolvePath("@/builtLayouts"), { recursive: true });
 const pathMapPath = resolvePath("@/builtLayouts/paths.json");
 const pathMapExists = fs.existsSync(pathMapPath);
 const key = path
 .relative(resolvePath("@/"), path.dirname(layoutContent))
 .replaceAll(path.sep, path.posix.sep);
 let pathMapObject = pathMapExists
 ? JSON.parse(await fsp.readFile(pathMapPath, "utf-8"))
 : { layouts: {} };
 let id = uniqueID();
 const existingLayout = pathMapObject.layouts[key];
 if (
 existingLayout &&
 fs.existsSync(
 path.join(resolvePath("@/builtLayouts"), `${existingLayout}.html`),
 )
 ) {
 id = existingLayout;
 }
 pathMapObject.layouts[key] = id;
 pathMapObject[componentName] = { layout: key };
 const content = getLayout(layoutContent, componentName);
 if (!content) return;
 await fsp.writeFile(
 path.join(resolvePath("@/builtLayouts"), `${id}.html`),
 formatHTML(content),
 );
 await fsp.writeFile(
 resolvePath("@/builtLayouts/paths.json"),
 JSON.stringify(pathMapObject, null, 2),
 "utf-8",
 );
}
export { generateLayoutFile };