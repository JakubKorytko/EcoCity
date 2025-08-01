import ReactiveComponent from "@Piglet/browser/classes/ReactiveComponent";
import CONST from "@Piglet/browser/CONST";
import {
 toPascalCase,
 toKebabCase,
 extractComponentTagsFromString,
} from "@Piglet/browser/sharedHelpers";
import State from "@Piglet/browser/classes/State";
const getDeepValue = function (obj, pathParts) {
 if (!pathParts) return obj;
 let result = obj;
 for (let i = 0; i < pathParts.length; i++) {
 if (result && result.hasOwnProperty(pathParts[i])) {
 result = result[pathParts[i]];
 } else {
 return undefined;
 }
 }
 return result;
};
const api = async function (path, fetchOptions = {}, expect = "raw") {
 const url = `${CONST.apiRoute}/${path.replace(/^\/+/, "")}`;
 let res;
 try {
 res = await fetch(url, fetchOptions);
 } catch (err) {
 throw CONST.error.failedToFetchAPI(url, err);
 }
 const contentType = res.headers.get("Content-Type") || "";
 const expected = expect.toLowerCase();
 if (expected === "raw") {
 return res;
 }
 const parsers = {
 json: () => res.json(),
 text: () => res.text(),
 blob: () => res.blob(),
 arrayBuffer: () => res.arrayBuffer(),
 formData: () => res.formData(),
 };
 const parse = parsers[expected];
 if (!parse) {
 throw CONST.error.unsupportedExpect(expect);
 }
 try {
 const data = await parse();
 if (!contentType.includes(expected)) {
 console.pig(
 CONST.warning.expectedButGot(expected, contentType),
 CONST.coreLogsLevels.warn,
 );
 }
 return data;
 } catch (err) {
 try {
 const fallback = await res.text();
 console.pig(
 CONST.warning.failedToParseAs(expected),
 CONST.coreLogsLevels.warn,
 );
 return fallback;
 } catch {
 throw CONST.error.failedToParseFromURL(expected, url);
 }
 }
};
const navigate = function (route, options = {}) {
 const { condition = true, fallback = "/" } = options;
 this.root.route = condition ? route : fallback;
 return true;
};
const { setViaGetterMarker, nestedDeepProxyMarker } = CONST.symbols;
const getMountedComponentsByTag = function (tagName, root) {
 const componentRefs = [];
 if (!root.mountedComponents.size) return componentRefs;
 for (const mountedComponent of root.mountedComponents) {
 if (mountedComponent.tag.toLowerCase() === tagName.toLowerCase()) {
 componentRefs.push(mountedComponent.ref);
 }
 }
 return componentRefs;
};
function setNativeAttributes(attrs) {
 for (const attr of Object.entries(attrs ?? {})) {
 const [name, attrValue] = attr;
 const value = String(attrValue);
 switch (name) {
 case "class":
 this.classList.add(...value.split(" "));
 break;
 case "style":
 this.style.cssText = value;
 break;
 case "id":
 this.id = value;
 break;
 default:
 break;
 }
 }
}
const debounceTimers = {};
const sendToExtension = (requestType, root) => {
 if (root.__componentName === "Herd") {
 root.config = root.originalRoot.config;
 root.extension = root.originalRoot.extension;
 }
 if (!root.config.allowDebugging) return;
 if (window.pigletExtensionCallbacks && !Object.keys(root.extension).length) {
 root.extension = window.pigletExtensionCallbacks;
 window.pigletExtensionCallbacks = undefined;
 window.pigletExtensionDebugRoot = root;
 }
 const { sendTreeUpdate, sendInitialData, sendStateUpdate } = root.extension;
 const actions = {};
 if (typeof sendTreeUpdate === "function") {
 actions.tree = sendTreeUpdate.bind(root, root);
 }
 if (typeof sendInitialData === "function") {
 actions.initial = sendInitialData.bind(root, root);
 }
 if (typeof sendStateUpdate === "function") {
 actions.state = sendStateUpdate.bind(root, root);
 }
 const action = actions[requestType];
 if (typeof action !== "function") return;
 clearTimeout(debounceTimers[requestType]);
 debounceTimers[requestType] = setTimeout(() => {
 console.pig(
 CONST.pigletLogs.sendToExtension,
 CONST.coreLogsLevels.info,
 requestType,
 );
 action();
 }, 300);
};
const loadComponent = function (_class) {
 const className = _class.name;
 const tagName = toKebabCase(className);
 const existingClass = customElements.get(tagName);
 if (!existingClass) {
 customElements.define(tagName, _class);
 }
 return customElements.whenDefined(tagName);
};
const fetchWithCache = async (url, root) => {
 if (!root.__fetchCache) {
 root.__fetchCache = new Map();
 }
 if (!root.__fetchQueue) {
 root.__fetchQueue = new Map(); // URL → Promise
 }
 if (url && root.__fetchCache.has(url)) {
 return root.__fetchCache.get(url);
 }
 if (root.__fetchQueue.has(url)) {
 return root.__fetchQueue.get(url);
 }
 const fetchPromise = (async () => {
 try {
 const response = await fetch(url);
 if (!response.ok) {
 throw CONST.error.failedToFetch(url);
 }
 const data = await response.text();
 root.__fetchCache.set(url, data);
 return data;
 } finally {
 root.__fetchQueue.delete(url);
 }
 })();
 root.__fetchQueue.set(url, fetchPromise);
 return fetchPromise;
};
function parseHTMLToFragment(html) {
 const doc = new DOMParser().parseFromString(html, "text/html");
 const frag = document.createDocumentFragment();
 [...doc.body.childNodes, ...doc.head.childNodes].forEach((node) =>
 frag.appendChild(node),
 );
 return frag;
}
const parseHTML = (html, owner) => {
 const fragment = parseHTMLToFragment(html);
 const elementsWithHyphen = [...fragment.querySelectorAll("*")].filter((el) =>
 el.tagName.includes("-"),
 );
 elementsWithHyphen.forEach((el) => {
 const tagName = el.tagName.toLowerCase();
 const customTag = customElements.get(tagName);
 if (!customTag) {
 return;
 }
 const attrs = Object.fromEntries(
 Array.from(el.attributes).map((attr) => [
 attr.name,
 attr.value === "" ? true : attr.value,
 ]),
 );
 attrs.fragmentRoot = owner.internal.fragment.enabled
 ? owner
 : owner.internal.fragment.fragmentRoot;
 attrs.parent = owner;
 const newEl = new customTag(attrs, owner.root);
 el.replaceWith(newEl);
 if (!el.childNodes.length) {
 return;
 }
 newEl.append(...el.childNodes);
 });
 return fragment;
};
const $create = function (strings, ...values) {
 const rawHtml = strings.join("$$SLOT$$").trim();
 const tagMatch = rawHtml.match(/^<([a-zA-Z0-9_-]+)\s*\$\$SLOT\$\$\s*\/?>$/);
 if (!tagMatch) {
 throw CONST.error.invalidMarkup(rawHtml);
 }
 const originalTag = tagMatch[1];
 const kebabTag = toKebabCase(originalTag);
 const attrs = values.find((v) => typeof v === "object" && v !== null);
 attrs.parent = this;
 const customTag = customElements.get(kebabTag);
 if (customTag) {
 return new customTag(attrs, this.root);
 }
 return document.createElement(kebabTag);
};
const fetchComponentData = async (
 componentName,
 types,
 root,
 shouldCache = true,
) => {
 const data = {
 html: undefined,
 script: undefined,
 base: undefined,
 layout: undefined,
 };
 root.previousFetchComponentCacheKeys[componentName] ??= {
 html: "",
 script: "",
 layout: "",
 };
 const previousCache = root.previousFetchComponentCacheKeys[componentName];
 if (!types.length) {
 return data;
 }
 if (types.includes(CONST.componentRoute.html)) {
 const cacheKey = CONST.cacheKey();
 if (!shouldCache) {
 previousCache.html = cacheKey;
 }
 const res = await fetch(
 `${CONST.componentRoute.html}/${componentName}${!shouldCache ? cacheKey : previousCache.html}`,
 );
 const html = await res.text();
 if (html !== CONST.componentNotFound && html !== "") {
 data.html = html;
 }
 }
 if (types.includes(CONST.componentRoute.layout)) {
 const cacheKey = CONST.cacheKey();
 if (!shouldCache) {
 previousCache.layout = cacheKey;
 }
 const res = await fetch(
 `${CONST.componentRoute.layout}/${componentName}${!shouldCache ? cacheKey : previousCache.layout}`,
 );
 const layout = await res.text();
 if (layout !== CONST.componentNotFound && layout !== "") {
 data.layout = layout;
 }
 }
 if (types.includes(CONST.componentRoute.script)) {
 const cacheKey = CONST.cacheKey();
 if (!shouldCache) {
 previousCache.script = cacheKey;
 }
 const module = await import(
 `${CONST.componentRoute.script}/${componentName}${!shouldCache ? cacheKey : previousCache.script}`
 );
 if (module.default !== false) {
 data.script = module.default;
 }
 }
 let cls;
 if (types.includes(CONST.componentRoute.base)) {
 if (!root.registeredComponents[componentName]) {
 cls = class extends ReactiveComponent {
 static name = componentName;
 constructor(attrs, root) {
 super(attrs, root);
 }
 };
 await loadComponent(cls);
 root.registeredComponents[componentName] = cls;
 } else {
 cls = root.registeredComponents[componentName];
 }
 data.base = cls;
 }
 return data;
};
const createStateProxy = function (asRef, host) {
 return new Proxy(
 {},
 {
 get(target, prop) {
 if (typeof prop === "symbol") return undefined;
 if (!(prop in host.states)) {
 host.states[prop] = host.state(prop, setViaGetterMarker, asRef);
 }
 const value = host.states[prop].value;
 return value === setViaGetterMarker ? undefined : value;
 },
 set(target, prop, value) {
 if (typeof prop === "symbol") return false;
 const key = String(prop);
 const isUsingUse = value && value.__piglet_use_marker === true;
 const isSetViaGetter = host.states?.[key]?.value === setViaGetterMarker;
 const initialValue = isUsingUse ? value.initialValue : value;
 const { avoidClone } = isUsingUse ? value : { avoidClone: false };
 if (!(key in host.states)) {
 host.states[key] = host.state(key, initialValue, asRef, avoidClone);
 } else if (!isUsingUse || isSetViaGetter) {
 const state = host.states[key];
 state.value = isSetViaGetter ? initialValue : value;
 }
 return true;
 },
 },
 );
};
const createDeepOnChangeProxy = function (target, root, onChange) {
 return new Proxy(target, {
 get(target, property) {
 const item = target[property];
 if (item && typeof item === "object") {
 if (root.__proxyCache.has(item)) return root.__proxyCache.get(item);
 const proxy = createDeepOnChangeProxy(item, root, onChange);
 root.__proxyCache.set(item, proxy);
 return proxy;
 }
 if (typeof item === "function") {
 return item.bind(target);
 }
 return item;
 },
 set(target, property, newValue) {
 target[property] = newValue;
 onChange();
 return true;
 },
 });
};
const useMarkerGenerator = function (initialValue, avoidClone = false) {
 return { __piglet_use_marker: true, initialValue, avoidClone };
};
const createNestedStateProxy = function (asRef, host) {
 return new Proxy(
 {},
 {
 get(target, prop) {
 if (typeof prop === "symbol") return undefined;
 if (!(prop in host.states)) {
 host.states[prop] = host.state(prop, setViaGetterMarker, asRef);
 const state = host.states[prop];
 if (typeof state.value === "object" && state.value !== null) {
 state.value = [
 createDeepOnChangeProxy(state.value, host.root, () => {
 host.root.globalState[host.__componentKey][key]._notify?.();
 sendToExtension(CONST.extension.state, host.root);
 }),
 nestedDeepProxyMarker,
 ];
 }
 }
 return host.states[prop].value;
 },
 set(target, prop, value) {
 if (typeof prop === "symbol") return false;
 const key = String(prop);
 const isUsingUse = value && value.__piglet_use_marker === true;
 const isSetViaGetter = host.states?.[key]?.value === setViaGetterMarker;
 const { avoidClone } = isUsingUse ? value : { avoidClone: false };
 const initialValue = isUsingUse ? value.initialValue : value;
 if (!(key in host.states)) {
 host.states[key] = host.state(key, initialValue, asRef, avoidClone);
 const state = host.states[key];
 if (typeof state.value === "object" && state.value !== null) {
 host.root.globalState[host.__componentKey][key]._state =
 createDeepOnChangeProxy(state.value, host.root, () =>
 host.root.globalState[host.__componentKey][key]._notify?.(),
 );
 }
 } else if (!isUsingUse || isSetViaGetter) {
 const state = host.states[key];
 if (typeof value === "object" && value !== null) {
 state.value = [
 createDeepOnChangeProxy(
 isSetViaGetter ? initialValue : value,
 host.root,
 () => {
 host.root.globalState[host.__componentKey][key]._notify?.();
 sendToExtension(CONST.extension.state, host.root);
 },
 ),
 nestedDeepProxyMarker,
 ];
 } else {
 state.value = isSetViaGetter ? initialValue : value;
 }
 }
 return true;
 },
 },
 );
};
function createStateIfMissing(
 componentName,
 key,
 initialValue,
 asRef,
 avoidClone,
 root,
) {
 if (!root.globalState[componentName]) {
 root.globalState[componentName] = {};
 }
 if (!root.globalState[componentName][key]) {
 root.globalState[componentName][key] = new State(
 initialValue,
 asRef,
 avoidClone,
 );
 const component = root.constructedComponents[componentName];
 const renderIfs = component?.shadowRoot.querySelectorAll("render-if");
 for (const renderIf of renderIfs) {
 let parsedCondition = renderIf.attrs.condition;
 if (typeof parsedCondition !== "string") continue;
 const negated = parsedCondition.startsWith("!");
 if (negated) parsedCondition = parsedCondition.substring(1);
 const herd = parsedCondition.startsWith("H$");
 const state = parsedCondition.startsWith("$");
 if (!state && !herd) continue;
 parsedCondition = parsedCondition.substring(state ? 1 : 2);
 const parts = parsedCondition.split(".");
 parsedCondition = parts.at(0);
 const isDependent = parsedCondition === key;
 if (isDependent) {
 renderIf._updateFromAttribute();
 }
 }
 }
}
export {
 getDeepValue,
 api,
 navigate,
 getMountedComponentsByTag,
 loadComponent,
 sendToExtension,
 fetchWithCache,
 parseHTML,
 $create,
 toPascalCase,
 toKebabCase,
 extractComponentTagsFromString,
 fetchComponentData,
 createNestedStateProxy,
 createStateProxy,
 createDeepOnChangeProxy,
 useMarkerGenerator,
 setNativeAttributes,
 createStateIfMissing,
};