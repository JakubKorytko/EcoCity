import CONST from "../misc/CONST.mjs";
import fs from "fs/promises";
import path from "path";
const console = global.console ?? window.console;
console.msg = function (path, ...args) {
 if (!path || typeof path !== "string") {
 console.msg("consoleMsg.invalidPath", path);
 return;
 }
 const keys = path.split(".");
 let current = CONST.consoleMessages;
 for (const key of keys) {
 if (current && typeof current === "object" && key in current) {
 current = current[key];
 } else {
 console.msg("consoleMsg.missingMessage", path);
 return;
 }
 }
 if (typeof current === "string") {
 console.log(current, ...args);
 } else if (typeof current === "function") {
 try {
 const result = current(...args);
 console.log(result);
 } catch (err) {
 console.msg("consoleMsg.evaluatingError", path, err);
 }
 } else {
 console.msg("consoleMsg.invalidMessageType", path);
 }
};
console.printPigAsciiSync = (data) => {
 const lines = data.split("\n");
 const maxWidth = Math.max(...lines.map((line) => line.length));
 const hotOrange = CONST.consoleCodes.colors.orange;
 const reset = CONST.consoleCodes.colorReset;
 console.mLog("pigAscii", "\n\n" + hotOrange + lines.join("\n") + reset);
 const label = "PigletJS";
 const padding = Math.floor((maxWidth - label.length) / 2);
 const centeredLabel = " ".repeat(Math.max(0, padding)) + label;
 console.mLog("pigAscii", hotOrange + "\n" + centeredLabel + reset + "\n\n");
 return console.popLog("pigAscii");
};
console.printPigAscii = async () => {
 try {
 const filePath = path.resolve(import.meta.dirname, "../misc/pig_ascii.txt");
 const data = await fs.readFile(filePath, "utf8");
 console.printPigAsciiSync(data);
 } catch (err) {
 console.error("Failed to read pig_ascii.txt:", err.message);
 }
};
console.mLog = function (label, ...args) {
 this.memory ??= {};
 this.memory[label] ??= "";
 this.memory[label] += args.join(" ") + "\n";
 console.log(...args);
};
console.popLog = function (label) {
 if (this.memory && this.memory[label]) {
 const log = this.memory[label];
 delete this.memory[label];
 return log;
 }
 return "";
};
console.cls = function (cursor = "") {
 console.clear();
 process.stdout.write(CONST.consoleCodes.clearScreen);
 if (cursor === "show") {
 process.stdout.write(CONST.consoleCodes.showCursor);
 } else if (cursor === "hide") {
 process.stdout.write(CONST.consoleCodes.hideCursor);
 }
};
console.hideCursor = function () {
 process.stdout.write(CONST.consoleCodes.hideCursor);
};
console.showCursor = function () {
 process.stdout.write(CONST.consoleCodes.showCursor);
};
export default console;