import {
 $create,
 createNestedStateProxy,
 createStateProxy,
 toKebabCase,
 useMarkerGenerator,
} from "@Piglet/browser/helpers";
import ReactiveComponent from "@Piglet/browser/classes/ReactiveComponent";
import ReactiveDummyComponent from "@Piglet/browser/classes/ReactiveDummyComponent";
import CONST from "@Piglet/browser/CONST";
const elementListeners = new WeakMap(); // el -> Map<event, Set<callback>>
const allTrackedElements = new Set(); // All els with listeners
const hostToElements = new WeakMap(); // host -> Set<shadowEl>
export const clearAllListenersForHost = function (hostElement) {
 const elements = hostToElements.get(hostElement);
 if (!elements) return;
 for (const el of elements) {
 const storage = elementListeners.get(el);
 if (storage) {
 for (const [event, callbacks] of storage.entries()) {
 for (const cb of callbacks) {
 el.removeEventListener(event, cb);
 }
 }
 storage.clear();
 }
 allTrackedElements.delete(el);
 }
 hostToElements.delete(hostElement);
};
const queryElements = function (hostElement, selector) {
 const root = hostElement.internal.fragment.enabled
 ? hostElement.internal.fragment.content
 : hostElement.shadowRoot;
 const isCustom =
 CONST.pascalCaseRegex.test(selector) &&
 !selector.startsWith("#") &&
 !selector.startsWith(".");
 const els = root.querySelectorAll(
 isCustom ? toKebabCase(selector) : selector,
 );
 if (!els.length) return [];
 const elements = Array.from(els);
 return elements.map((el) => queryElement(hostElement, el));
};
const queryElement = function (hostElement, selectorOrNode) {
 const root = hostElement.internal.fragment.enabled
 ? hostElement.internal.fragment.content
 : hostElement.shadowRoot;
 let el;
 if (selectorOrNode instanceof Node) {
 el = selectorOrNode;
 } else {
 const isCustom =
 CONST.pascalCaseRegex.test(selectorOrNode) &&
 !selectorOrNode.startsWith("#") &&
 !selectorOrNode.startsWith(".");
 el = root.querySelector(
 isCustom ? toKebabCase(selectorOrNode) : selectorOrNode,
 );
 }
 if (!el) return undefined;
 if (!hostToElements.has(hostElement)) {
 hostToElements.set(hostElement, new Set());
 }
 hostToElements.get(hostElement).add(el);
 allTrackedElements.add(el);
 const ensureStorage = () => {
 if (!elementListeners.has(el)) {
 elementListeners.set(el, new Map());
 }
 return elementListeners.get(el);
 };
 
 const api = {
 on(event, callback, options) {
 el.addEventListener(event, callback, options);
 const storage = ensureStorage();
 if (!storage.has(event)) storage.set(event, new Set());
 storage.get(event).add(callback);
 return proxy;
 },
 off(event, callback) {
 el.removeEventListener(event, callback);
 elementListeners.get(el)?.get(event)?.delete(callback);
 return proxy;
 },
 clearListeners() {
 const storage = elementListeners.get(el);
 if (storage) {
 for (const [event, callbacks] of storage.entries()) {
 for (const cb of callbacks) {
 el.removeEventListener(event, cb);
 }
 }
 storage.clear();
 }
 allTrackedElements.delete(el);
 hostToElements.get(hostElement)?.delete(el);
 return proxy;
 },
 pass(updates) {
 if (el && el instanceof ReactiveComponent) {
 const passInfo = {
 ref: el,
 updates: {},
 delayed: updates.delayed,
 };
 for (const [key, value] of Object.entries(updates)) {
 const previousValue = el.attrs[key];
 if (previousValue !== value) {
 passInfo.updates[key] = value;
 }
 }
 if (Object.keys(passInfo.updates).length === 0) {
 return proxy;
 }
 hostElement.forwardedQueue.push(passInfo);
 }
 return proxy;
 },
 clone() {
 if (
 !(
 el instanceof ReactiveComponent ||
 el instanceof ReactiveDummyComponent
 )
 ) {
 return el.cloneNode(true);
 } else {
 const newEl = new el.constructor(el.attrs, hostElement.root);
 for (const child of el.childNodes) {
 if (child instanceof ReactiveComponent) {
 newEl.appendChild(child.cloneNode(true));
 } else {
 newEl.appendChild(child.cloneNode(true));
 }
 }
 return newEl;
 }
 },
 };
 const proxy = new Proxy(api, {
 get(target, prop, receiver) {
 if (prop in target) {
 return Reflect.get(target, prop, receiver);
 }
 if (el) {
 const value = el[prop];
 return typeof value === "function" ? value.bind(el) : value;
 }
 },
 set(target, prop, value) {
 if (el) {
 el[prop] = value;
 return true;
 }
 return false;
 },
 });
 return proxy;
};
const generateComponentData = function (hostElement) {
 
 const onBeforeUpdateRef = {
 value: () => {},
 };
 
 const onAfterUpdateRef = {
 value: () => {},
 };
 return {
 component: {
 $attrs: hostElement.attrs,
 $P: createStateProxy(false, hostElement),
 $B: createStateProxy(true, hostElement),
 $$: useMarkerGenerator,
 $$P: createNestedStateProxy(false, hostElement),
 $: $create.bind(hostElement),
 $this: hostElement,
 $document: hostElement.shadowRoot,
 out: CONST.stopComponentScriptExecution,
 $navigate: hostElement.root.navigate,
 $api: hostElement.root.api,
 $types: hostElement.root.types,
 $H: hostElement.root.herd.shallow(hostElement),
 $$H: hostElement.root.herd.deep(hostElement),
 },
 callbacks: {
 $onBeforeUpdate: (callback) => {
 onBeforeUpdateRef.value = callback;
 },
 $onAfterUpdate: (callback) => {
 onAfterUpdateRef.value = callback;
 },
 onAfterUpdateRef,
 onBeforeUpdateRef,
 $element: queryElement.bind(this, hostElement),
 $elements: queryElements.bind(this, hostElement),
 },
 };
};
const componentMountCleanup = function (
 hostElement,
 { onBeforeUpdateRef, onAfterUpdateRef },
) {
 hostElement.onBeforeUpdate = onBeforeUpdateRef.value;
 hostElement.onAfterUpdate = onAfterUpdateRef.value;
};
const scriptRunner = function (hostElement, module, scriptReason) {
 function mountCallback(mountReason) {
 const { component, callbacks } = generateComponentData(this);
 let shouldRender = true;
 if (typeof hostElement.onBeforeUpdate === "function") {
 shouldRender = hostElement.onBeforeUpdate() !== false;
 }
 if (!shouldRender) {
 return;
 }
 const moduleFunction = module.bind(this);
 try {
 moduleFunction({
 ...component,
 ...callbacks,
 $reason: mountReason ?? scriptReason,
 });
 } catch (e) {
 if (e !== CONST.stopComponentScriptExecution) {
 console.error(CONST.pigletLogs.errorInComponentScript, e);
 }
 }
 componentMountCleanup(this, callbacks);
 if (typeof this.onAfterUpdate === "function") {
 this.onAfterUpdate();
 }
 while (this.forwardedQueue.length) {
 const { ref, delayed, updates } = this.forwardedQueue.shift();
 ref.attrs = { ...ref.attrs, ...updates };
 if (
 ref?.internal?.mounted &&
 typeof ref?.__mountCallback === "function"
 ) {
 if (delayed) {
 setTimeout(() => {
 ref.__mountCallback(CONST.reason.attributesChange(updates));
 }, 0);
 } else {
 ref.__mountCallback(CONST.reason.attributesChange(updates));
 }
 }
 }
 }
 hostElement.__mountCallback = mountCallback.bind(hostElement);
};
export default scriptRunner;