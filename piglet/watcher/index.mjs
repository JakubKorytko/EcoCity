import fs from "fs";
import { resolvePath } from "@Piglet/utils/paths";
import { processAllComponents } from "@Piglet/parser/component";
import { createSubprocess, resetSubprocess } from "@Piglet/watcher/methods";
import console from "@Piglet/utils/console";
import { subprocessRef } from "@Piglet/watcher/subprocessRef";
import { mergeWebTypes } from "@Piglet/builder/webTypes";
const resetServer = (eventType, filename) =>
 resetSubprocess(eventType, filename, false);
const resetServerOnButtonClick = () =>
 resetSubprocess(undefined, undefined, true);
const directoriesToWatch = [
 "@/server",
 "@Piglet/watcher",
 "@Piglet/utils",
 "@Piglet/libs",
 "@Piglet/controllers",
];
for (const directory of directoriesToWatch) {
 const fullPath = resolvePath(directory);
 if (fs.existsSync(fullPath)) {
 fs.watch(fullPath, { recursive: true }, (...args) => {
 resetServer(...args);
 });
 } else {
 console.msg("server.directoryDoNotExist", fullPath);
 }
}
process.stdin.setEncoding("utf-8");
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.resume();
subprocessRef.instance = createSubprocess();
process.stdin.on("data", async (key) => {
 if (typeof key === "string" && key === "r") {
 console.msg("components.reloading");
 try {
 const descriptions = await processAllComponents();
 await mergeWebTypes(descriptions);
 console.msg("components.regenerated");
 subprocessRef.instance.send({ type: "reload" });
 } catch (err) {
 console.msg("components.regeneratingError", err);
 }
 }
 if (typeof key === "string" && key === "s") {
 subprocessRef.instance.send({ type: "serverRestart" });
 console.msg("server.restarting");
 resetServerOnButtonClick();
 }
 if (typeof key === "string" && key === "\u0003") {
 console.msg("server.shuttingDown");
 subprocessRef.instance.kill("SIGINT");
 subprocessRef.instance = null;
 process.exit();
 }
});