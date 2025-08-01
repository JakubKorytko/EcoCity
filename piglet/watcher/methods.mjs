import fs from "fs";
import path from "path";
import { fork } from "child_process";
import { getRootDirFromArgv, resolvePath } from "@Piglet/utils/paths";
import { buildComponent } from "@Piglet/parser/component";
import { subprocessRef } from "@Piglet/watcher/subprocessRef";
import { reloadClients, fullReload } from "@Piglet/libs/socket";
import { toKebabCase } from "@Piglet/libs/helpers";
import console from "@Piglet/utils/console";
const createSubprocess = (args = []) => {
 try {
 const entryPath = resolvePath("@/server/index.mjs");
 if (!fs.existsSync(entryPath)) {
 console.msg("watcher.entryFileNotFound", entryPath);
 console.msg("watcher.pleaseCreateEntryFile", entryPath);
 process.exit(1);
 return null;
 }
 return fork(
 entryPath,
 [`--rootDir=${getRootDirFromArgv(process.argv)}`, ...args],
 {},
 );
 } catch (error) {
 console.msg("watcher.errorInCreateSubprocess", error);
 return null;
 }
};
let debounceTimeout;
const resetSubprocess = (eventType, filename, forced = false) => {
 if (forced || (filename && filename.endsWith(".mjs"))) {
 clearTimeout(debounceTimeout);
 debounceTimeout = setTimeout(() => {
 subprocessRef.instance.kill("SIGINT");
 subprocessRef.instance = null;
 subprocessRef.instance = createSubprocess(["--restart"]);
 }, 500);
 }
};
const watchDirectory = () => {
 let debounceTimeout;
 fs.watch(
 resolvePath("@/components"),
 { recursive: true },
 (eventType, filename) => {
 if (filename && filename.includes(".pig.")) {
 const htmlFilename = path.format({
 ...path.parse(filename),
 base: "",
 ext: ".html",
 });
 const socketData = toKebabCase(
 path.basename(htmlFilename, ".pig.html"),
 );
 clearTimeout(debounceTimeout);
 debounceTimeout = setTimeout(() => {
 const filePath = resolvePath(`@/components/${htmlFilename}`);
 console.msg("components.changed", htmlFilename);
 buildComponent(filePath)
 .catch((err) => console.msg("components.generatingError", err))
 .then(() => reloadClients(socketData));
 }, 500);
 }
 },
 );
 console.msg("components.watchingForChanges", resolvePath("@/components"));
 fs.watch(
 resolvePath("@/pages"),
 { recursive: true },
 (eventType, filename) => {
 if (filename && filename.includes(".pig.")) {
 const htmlFilename = path.format({
 ...path.parse(filename),
 base: "",
 ext: ".html",
 });
 const fileName = path.basename(htmlFilename, ".pig.html");
 const isLayout = fileName.toLowerCase() === "layout";
 const socketData = toKebabCase(fileName);
 clearTimeout(debounceTimeout);
 debounceTimeout = setTimeout(() => {
 const filePath = resolvePath(`@/pages/${htmlFilename}`);
 console.msg("components.changed", htmlFilename);
 buildComponent(filePath)
 .catch((err) => console.msg("pages.generatingError", err))
 .then(() => reloadClients(isLayout ? "layout" : socketData));
 }, 500);
 }
 },
 );
 console.msg("components.watchingForChanges", resolvePath("@/pages"));
 const filesForFullReload = [resolvePath("@/Pig.html")];
 for (const file of filesForFullReload) {
 fs.watchFile(file, { interval: 500 }, (curr, prev) => {
 if (curr.mtime !== prev.mtime) {
 console.msg("components.fullReloadTriggered", file);
 fullReload();
 }
 });
 console.msg("components.watchingForChanges", file);
 }
};
export { watchDirectory, resetSubprocess, createSubprocess };