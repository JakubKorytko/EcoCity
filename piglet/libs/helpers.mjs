import CONST from "@Piglet/misc/CONST";
import fs from "fs";
import { processAllComponents } from "@Piglet/parser/component";
import { watchDirectory } from "@Piglet/watcher/methods";
import { routes } from "@Piglet/libs/routes";
import { mergeWebTypes } from "@Piglet/builder/webTypes";
import console from "@Piglet/utils/console";
import {
 toPascalCase,
 toKebabCase,
 extractComponentTagsFromString,
} from "@Piglet/browser/sharedHelpers";
import { resolvePath } from "@Piglet/utils/paths";
const routeNames = CONST.routes.reduce((acc, route) => {
 acc[route] = Symbol(route);
 return acc;
}, {});
const getRouteFromRequest = (req) => {
 const path = req.url;
 const startsWithExact = (prefix) =>
 path === prefix || path.startsWith(prefix + "/");
 if (startsWithExact(CONST.customRouteAliases.api)) return routeNames.api;
 if (startsWithExact(CONST.customRouteAliases.module))
 return routeNames.module;
 if (startsWithExact(CONST.customRouteAliases.component))
 return routeNames.component;
 if (startsWithExact(CONST.customRouteAliases.piglet))
 return routeNames.piglet;
 if (fs.existsSync(routes[path])) return routeNames.page;
 return routeNames.file;
};
function convertSelectorsPascalToSnake(cssText) {
 return cssText.replace(/([^{]+){/g, (match, selectorGroup) => {
 const converted = selectorGroup.replace(
 /(?<![#.:\-\w])([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*)(?![\w-])/g,
 (_, name) => {
 return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
 },
 );
 return converted + "{";
 });
}
async function runWatcher() {
 if ([...process.argv].includes("--restart")) {
 console.msg("server.restarted");
 } else {
 console.msg("server.running", CONST.PORT);
 console.msg("server.pressReload");
 console.msg("server.pressRestart");
 }
 try {
 const descriptions = await processAllComponents();
 await mergeWebTypes(descriptions);
 watchDirectory();
 } catch (err) {
 console.msg("server.initError", err);
 }
}
const proxyHandler = {
 customRoutes: {},
 set(target, prop, value, receiver) {
 if (Object.values(routeNames).includes(prop)) {
 const newValue = { ...this.customRoutes, [prop]: value };
 this.customRoutes = newValue;
 return Reflect.set(target, "customRoutes", newValue, receiver);
 } else {
 return Reflect.set(target, prop, value, receiver);
 }
 },
 get(target, prop, receiver) {
 if (prop === "listen") {
 return (...args) => {
 runWatcher()
 .then(() => {
 target.listen(...args);
 })
 .catch((err) => {
 console.msg("server.errorInRunWatcher", err);
 });
 };
 }
 if (Object.values(routeNames).includes(prop)) {
 return this.customRoutes[prop];
 } else {
 return Reflect.get(target, prop, receiver);
 }
 },
};
const isRequestFromServer = (req) => {
 if ("server" in req.socket) {
 
 const server = req.socket.server;
 if ("customRoutes" in server) {
 return true;
 }
 }
 return false;
};
const serverHandler = async (req, res) => {
 if (isRequestFromServer(req)) {
 return req.socket.server.customRoutes[getRouteFromRequest(req)](req, res);
 }
};
function getPaths() {
 if (!fs.existsSync(resolvePath("@/builtLayouts/paths.json"))) return false;
 return fs.readFileSync(resolvePath("@/builtLayouts/paths.json"), "utf-8");
}
function getLayoutFilePath(componentName, paths) {
 if (!paths) return false;
 const pathsObj = JSON.parse(paths);
 const path = pathsObj[componentName]?.layout;
 const layoutValue = pathsObj?.layouts[path];
 const layoutFilePath = resolvePath(`@/builtLayouts/${layoutValue}.html`);
 if (!fs.existsSync(layoutFilePath)) {
 return false;
 }
 return layoutFilePath;
}
export {
 routeNames,
 proxyHandler,
 getRouteFromRequest,
 serverHandler,
 runWatcher,
 toPascalCase,
 toKebabCase,
 extractComponentTagsFromString,
 getLayoutFilePath,
 getPaths,
 convertSelectorsPascalToSnake,
};