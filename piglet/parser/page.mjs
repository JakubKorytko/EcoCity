import fs from "fs/promises";
import { resolvePath } from "@Piglet/utils/paths";
import console from "@Piglet/utils/console";
import CONST from "@Piglet/misc/CONST";
const transformAppTags = function (html, route) {
 return html.replace(/<\/?App([^>]*)\/?>/g, (_, attrs = "") => {
 const isClosing = _.startsWith("</");
 const isSelfClosing = _.endsWith("/>");
 if (isClosing) return `</app-root>`;
 const finalAttrs = `${attrs} route="${route}"`;
 return isSelfClosing
 ? `<app-root${finalAttrs}></app-root>`
 : `<app-root${finalAttrs}>`;
 });
};
const injectScriptBeforeBody = function (html, scriptSrc) {
 return html.replace(
 /<\/body>/g,
 () => `<script type="module" src="${scriptSrc}"></script></body>`,
 );
};
async function generateAppHtml(route) {
 const appHtmlPath = resolvePath("@/Pig.html");
 try {
 const appHtml = await fs.readFile(appHtmlPath, "utf-8");
 const withAppRoot = transformAppTags(appHtml, route);
 return injectScriptBeforeBody(withAppRoot, CONST.customRouteAliases.piglet);
 } catch (err) {
 console.msg("pages.htmlGeneratingError", err);
 return false;
 }
}
export { generateAppHtml };