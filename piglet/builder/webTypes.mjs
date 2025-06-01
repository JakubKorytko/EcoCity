import fs from "fs/promises";
import { resolvePath } from "@Piglet/utils/paths";
import console from "@Piglet/utils/console";
export async function mergeWebTypes(newElements) {
 const basePath = resolvePath("@Piglet/builder/native-web-types.json");
 const outputPath = resolvePath("./web-types.json");
 let baseJson;
 try {
 const file = await fs.readFile(basePath, "utf-8");
 baseJson = JSON.parse(file);
 } catch (err) {
 console.msg("webTypes.failedToLoad", basePath, err);
 return;
 }
 if (!baseJson.contributions?.html?.elements) {
 baseJson.contributions = baseJson.contributions || {};
 baseJson.contributions.html = baseJson.contributions.html || {};
 baseJson.contributions.html.elements = [];
 }
 const existingNames = new Set(
 baseJson.contributions.html.elements.map((el) => el.name),
 );
 let addedCount = 0;
 for (const el of newElements) {
 if (el && el.name && !existingNames.has(el.name)) {
 baseJson.contributions.html.elements.push(el);
 existingNames.add(el.name);
 addedCount++;
 }
 }
 try {
 await fs.writeFile(outputPath, JSON.stringify(baseJson, null, 2), "utf-8");
 console.msg("webTypes.added", addedCount);
 } catch (err) {
 console.msg("webTypes.failedToWrite", outputPath, err);
 }
}