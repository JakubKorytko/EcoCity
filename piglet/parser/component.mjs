import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { resolvePath } from "@Piglet/utils/paths";
import {
 convertSelectorsPascalToSnake,
 extractComponentTagsFromString,
 toKebabCase,
 toPascalCase,
} from "@Piglet/libs/helpers";
import { parseRoutes, routes } from "@Piglet/libs/routes";
import { formatHTML, formatJS } from "@Piglet/parser/format";
import CONST from "@Piglet/misc/CONST";
import console from "@Piglet/utils/console";
import { generateLayoutFile } from "@Piglet/parser/layout";
function extractAndRemoveCssImports(css) {
 const importRegex = /^@import\s+[^;]+;/gm;
 const imports = [];
 let cleaned;
 let match;
 while ((match = importRegex.exec(css)) !== null) {
 imports.push(match[0]);
 }
 cleaned = css.replace(importRegex, "").trim();
 return {
 imports,
 cleanedCode: cleaned,
 };
}
function extractAndRemoveImports(code) {
 const importRegex = /^import\s+[\s\S]*?["'][^"']+["'];?/gm;
 const imports = [];
 let cleaned;
 let match;
 while ((match = importRegex.exec(code)) !== null) {
 imports.push(match[0]);
 }
 cleaned = code.replace(importRegex, "").trim();
 return {
 imports,
 cleanedCode: cleaned,
 };
}
async function findMatchingExternalFile(rootDir, baseName, extension) {
 const files = await fsp.readdir(rootDir, { withFileTypes: true });
 for (const file of files) {
 const fullPath = path.join(rootDir, file.name);
 if (file.isDirectory()) {
 const found = await findMatchingExternalFile(
 fullPath,
 baseName,
 extension,
 );
 if (found) return found;
 }
 if (file.isFile() && file.name === `${baseName}${extension}`) {
 return fullPath;
 }
 }
 return null;
}
const styleRegex = (html) => html.match(/<style>([\s\S]*?)<\/style>/i);
const contentRegex = (html) => html.match(/<content>([\s\S]*?)<\/content>/i);
const scriptRegex = (html) => html.match(/<script>([\s\S]*?)<\/script>/i);
const generateComponentScript = async (scriptJS, externalJS, componentName) => {
 if (!scriptJS && !externalJS) return;
 const useAsyncRegex = /^\s*["']use async['"]\s*[;|\n]/gm;
 let isAsync = false;
 const fullScript = [externalJS, scriptJS]
 .filter(Boolean)
 .map((script) => {
 const isCurrentAsync = useAsyncRegex.test(script);
 if (isCurrentAsync) {
 isAsync = true;
 return script.replace(useAsyncRegex, "").trim();
 }
 return script;
 })
 .join("\n\n");
 const { imports, cleanedCode } = extractAndRemoveImports(fullScript);
 await fsp.mkdir(resolvePath("@/builtScript"), {
 recursive: true,
 });
 const outputPath = resolvePath(`@/builtScript/${componentName}.mjs`);
 const scriptForFile = formatJS(`
 ${imports.join("\n")}
 ${CONST.parserStrings.exportBeforeScript(isAsync)}
 ${cleanedCode}\n}`);
 return fsp.writeFile(outputPath, scriptForFile);
};
const injectInnerHTMLToComponent = (
 html,
 content,
 componentName,
 externalCSS,
) => {
 let modifiedContent = content;
 const componentTags = extractComponentTagsFromString(html);
 componentTags.forEach((tag) => {
 const selfClosingTagRegex = new RegExp(
 `<\\s*${tag}(|(\\s([^>]*)))\/>`,
 "g",
 );
 const kebabTag = toKebabCase(tag);
 modifiedContent = modifiedContent.replace(
 selfClosingTagRegex,
 `<${kebabTag}$1></${kebabTag}>`,
 );
 modifiedContent = modifiedContent.replace(
 new RegExp(`<\\s*${tag}(|(\\s([^>]*)))>`, "g"),
 `<${kebabTag}$1>`,
 );
 modifiedContent = modifiedContent.replace(
 new RegExp(`</\\s*${tag}\\s*>`, "g"),
 `</${kebabTag}>`,
 );
 });
 const styleMatch = styleRegex(html);
 const cssImports = [];
 const styleCSS = [externalCSS, styleMatch ? styleMatch[1].trim() : ""]
 .filter(Boolean)
 .map((css) => {
 const { imports, cleanedCode } = extractAndRemoveCssImports(css);
 cssImports.push(...imports);
 return cleanedCode;
 })
 .join("\n\n");
 const convertedCSS = convertSelectorsPascalToSnake(styleCSS);
 return `
 <style>
 ${cssImports.join("\n")}
 ${convertedCSS}
 </style>
 ${modifiedContent}
 `;
};
const generateOutput = async (_, ...args) => {
 if (args.length !== 5) {
 console.msg("components.outputGenerationError", new Error());
 }
 const componentName = args[0];
 const html = args[1];
 const content = args[2];
 const externalCSS = args[3];
 const externalJS = args[4];
 const scriptMatch = scriptRegex(html);
 const scriptJS = scriptMatch ? scriptMatch[1].trim() : "";
 await generateComponentScript(scriptJS, externalJS, componentName);
 const innerHTML = formatHTML(
 injectInnerHTMLToComponent(
 html,
 content,
 componentName,
 externalCSS,
 ).trim(),
 );
 await fsp.mkdir(resolvePath("@/builtHTML"), {
 recursive: true,
 });
 const outputPath = resolvePath(`@/builtHTML/${componentName}.html`);
 await fsp.writeFile(outputPath, innerHTML);
 console.msg("components.generated", componentName);
};
const getContentTag = (html) => {
 const contentMatch = contentRegex(html);
 if (!contentMatch) {
 return undefined;
 }
 return contentMatch[1].trim();
};
async function buildComponent(filePath) {
 try {
 const html = await fsp.readFile(filePath, "utf-8");
 const content = getContentTag(html);
 if (!content) {
 console.msg("components.missingContent", filePath);
 }
 const baseName = path.basename(filePath, ".pig.html");
 const componentName = toPascalCase(baseName);
 const externalCSSPath = await findMatchingExternalFile(
 resolvePath("@/src"),
 baseName,
 ".pig.css",
 );
 const externalJSPath = await findMatchingExternalFile(
 resolvePath("@/src"),
 baseName,
 ".pig.mjs",
 );
 let externalCSS = "";
 let externalJS = "";
 if (fs.existsSync(externalCSSPath)) {
 externalCSS = await fsp.readFile(externalCSSPath, "utf-8");
 }
 if (fs.existsSync(externalJSPath)) {
 externalJS = await fsp.readFile(externalJSPath, "utf-8");
 }
 await generateLayoutFile(filePath, componentName);
 await generateOutput`
 Component name: ${componentName}
 Component content: ${html}${content}
 External data: ${externalCSS}${externalJS}`;
 } catch (err) {
 if (err.message === "components.outputGenerationError") {
 console.msg(err.message, err);
 } else {
 console.msg("components.generationError", filePath, err);
 }
 }
}
async function extractDescriptionsFromFile(filePath) {
 try {
 const fileContent = await fsp.readFile(filePath, "utf-8");
 const descriptionMatches = [];
 const regex =
 /<script\s+type=["']application\/json["']\s*>([\s\S]*?)<\/script>/g;
 let match;
 while ((match = regex.exec(fileContent)) !== null) {
 let raw = match[1].trim();
 if (raw.endsWith(";")) {
 raw = raw.slice(0, -1);
 }
 try {
 const descriptionData = JSON.parse(raw);
 const { attributes } = CONST.defaultWebType(filePath);
 descriptionData.attributes ??= [];
 descriptionData.attributes.push(...attributes);
 descriptionMatches.push(descriptionData);
 } catch (e) {
 console.msg("components.errorParsingDescription", e);
 }
 }
 return descriptionMatches;
 } catch (err) {
 console.msg("components.errorReadingFile", err);
 return [];
 }
}
async function processAllComponents(dir = resolvePath("@/components")) {
 const descriptions = [];
 try {
 const appPath = resolvePath("@/src/App.pig.html");
 const pagesDir = resolvePath("@/pages");
 if (fs.existsSync(appPath) && Object.values(arguments).length === 0) {
 console.msg("components.generatingFrom", "App.pig.html");
 const appHtml = await fsp.readFile(appPath, "utf-8");
 parseRoutes(appHtml, pagesDir);
 for (const route of Object.values(routes)) {
 await buildComponent(route);
 const pageDescriptions = await extractDescriptionsFromFile(route);
 if (pageDescriptions.length === 0) {
 descriptions.push(CONST.defaultWebType(route));
 } else {
 descriptions.push(...pageDescriptions);
 }
 }
 }
 const files = await fsp.readdir(dir, { withFileTypes: true });
 for (const file of files) {
 const filePath = path.join(dir, file.name);
 if (file.isDirectory()) {
 const nestedDescriptions = await processAllComponents(filePath);
 descriptions.push(...nestedDescriptions); // Flatten the array
 } else if (file.name.endsWith(".pig.html")) {
 console.msg("components.generatingFrom", file.name);
 await buildComponent(filePath);
 const componentDescriptions =
 await extractDescriptionsFromFile(filePath);
 if (componentDescriptions.length === 0) {
 descriptions.push(CONST.defaultWebType(filePath));
 } else {
 descriptions.push(...componentDescriptions);
 }
 }
 }
 } catch (err) {
 console.msg("components.processingError", err);
 }
 return descriptions;
}
export {
 buildComponent,
 processAllComponents,
 getContentTag,
 styleRegex,
 injectInnerHTMLToComponent,
};