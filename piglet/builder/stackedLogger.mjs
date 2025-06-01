import console from "../utils/console.mjs";
import CONST from "../misc/CONST.mjs";
function stripAnsi(str) {
 return str.replace(/\x1b\[[0-9;]*m/g, "");
}
function formatLine({ label, entries, total, colorCode }) {
 const maxWidth = process.stdout.columns || 80;
 const headRaw = `${label}: `;
 const head = colorCode + headRaw + CONST.consoleCodes.colorReset;
 const available = maxWidth - stripAnsi(head).length;
 let output = "";
 let used = 0;
 let shown = 0;
 for (const entry of entries) {
 const s = entry + ", ";
 if (used + s.length > available) break;
 output += s;
 used += s.length;
 shown++;
 }
 if (output.endsWith(", ")) output = output.slice(0, -2);
 const hidden = total - shown;
 const more = hidden > 0 ? ` \x1b[90m…and ${hidden} more\x1b[0m` : "";
 return head + (output ?? "none") + more;
}
export function createStackedLogger({ limit = 10, preLog = "" } = {}) {
 
 const channels = new Map();
 
 const channelOrder = [];
 let isRunning = true;
 const colorPool = Object.values(CONST.consoleCodes.colors);
 let colorIndex = 0;
 
 function renderAll() {
 if (!isRunning) return;
 console.cls();
 if (preLog) console.log(preLog);
 for (const id of channelOrder) {
 const ch = channels.get(id);
 console.log(formatLine(ch));
 }
 }
 console.hideCursor();
 
 const create = function (id, label, color = null) {
 if (channels.has(id)) throw new Error(`Logger '${id}' already exists`);
 const colorCode = color || colorPool[colorIndex++ % colorPool.length];
 channels.set(id, { label, entries: [], total: 0, colorCode });
 channelOrder.push(id);
 renderAll();
 };
 
 const log = function (id, message) {
 const ch = channels.get(id);
 if (!ch) throw new Error(`Logger '${id}' does not exist`);
 ch.entries.push(message);
 if (ch.entries.length > limit) ch.entries.shift();
 ch.total++;
 renderAll();
 };
 
 const stop = function () {
 isRunning = false;
 console.cls();
 if (preLog) console.log(preLog);
 for (const id of channelOrder) {
 const ch = channels.get(id);
 console.log(formatLine(ch));
 }
 console.showCursor();
 };
 return { create, log, stop };
}