import { useState, useObserver } from "@Piglet/browser/hooks";
import {
 parseHTML,
 sendToExtension,
 fetchComponentData,
 extractComponentTagsFromString,
 fetchWithCache,
 setNativeAttributes,
} from "@Piglet/browser/helpers";
import CONST from "@Piglet/browser/CONST";
import scriptRunner, {
 clearAllListenersForHost,
} from "@Piglet/browser/scriptRunner";
class ReactiveComponent extends HTMLElement {
 #pendingStateUpdate = false;
 
 #batchedChanges = [];
 
 onBeforeUpdate() {}
 
 onAfterUpdate() {}
 
 __mountCallback(reason) {}
 
 __componentName = "";
 
 __componentId;
 
 __componentKey = "";
 
 __mountData;
 
 __observers;
 
 attrs = {};
 
 forwardedQueue = [];
 
 _storedChildren = document.createDocumentFragment();
 
 childrenInjected = false;
 
 states = {};
 
 internal = {
 owner: undefined,
 HMR: true,
 mounted: false,
 children: [],
 waiters: [],
 fragment: {
 content: undefined,
 enabled: false,
 fragmentRoot: undefined,
 },
 get parent() {
 return this.owner._parent;
 },
 };
 
 initialSetup(attrs) {
 this.attrs = attrs ?? {};
 this.internal.owner = this;
 this._parent = this.attrs.parent ?? undefined;
 this.internal.fragment.enabled = this.attrs.fragment ?? false;
 this.internal.fragment.fragmentRoot = this.attrs.fragmentRoot ?? undefined;
 this.__observers = new Map();
 this.__componentId = this.root.componentCounter++;
 this.__componentName = this.constructor.name;
 this.__componentKey = `${this.__componentName}${this.__componentId}`;
 this.__mountData = {
 key: this.__componentKey,
 tag: this.tagName,
 ref: this,
 };
 this._parent?.internal.children.push(this);
 this.root.constructedComponents[this.__componentKey] = this;
 }
 constructor(attrs, root) {
 super();
 setNativeAttributes.call(this, attrs);
 if (this.constructor.name === CONST.appRootName) {
 this.constructedComponents = {};
 this.componentCounter = 0;
 this.root = this;
 } else {
 this.root = root ?? this.root;
 }
 this.initialSetup(attrs);
 const { fragmentRoot } = this.internal.fragment;
 const fragmentEnabled = fragmentRoot?.internal.fragment.enabled;
 if (fragmentRoot && !fragmentEnabled) {
 return undefined;
 }
 this.attachShadow({ mode: "open" });
 }
 
 connectedCallback() {
 const parent = this.internal.parent.internal;
 if (parent.mounted) {
 this._mount(CONST.reason.onMount);
 } else {
 parent.waiters.push(this);
 }
 }
 
 disconnectedCallback() {
 this.unmount();
 }
 
 async _mount(reason) {
 await this.runScript(reason);
 const shouldContinue = await this.loadContent(CONST.reasonCache(reason));
 if (!shouldContinue) return Promise.resolve(false);
 sendToExtension(CONST.extension.tree, this.root);
 this.__mountCallback(reason);
 this.internal.mounted = true;
 this.root.mountedComponents.add(this.__mountData);
 console.pig(CONST.pigletLogs.appRoot.componentConnected(this));
 
 const promises = [];
 while (this.internal.waiters.length > 0) {
 promises.push(
 this.internal.waiters.shift()._mount(CONST.reason.parentUpdate),
 );
 }
 return Promise.all(promises);
 }
 
 unmount() {
 this.root.mountedComponents.delete(this.__mountData);
 this.__mountCallback = () => {};
 this.internal.mounted = false;
 for (const remove of this.__observers.values()) {
 remove?.(this);
 }
 this.__observers.clear();
 this.shadowRoot?.replaceChildren();
 sendToExtension(CONST.extension.tree, this.root);
 }
 
 disableHMR() {
 this.internal.HMR = false;
 }
 
 injectFragment() {
 if (!this.internal.fragment.content || !this.internal.fragment.enabled)
 return;
 this.internal.fragment.enabled = false;
 this.shadowRoot.appendChild(this.internal.fragment.content);
 this.__mountCallback(CONST.reason.fragmentInjected);
 }
 
 appendChildren(fragment) {
 const kinderGarten = fragment.querySelector("kinder-garten");
 if (!kinderGarten) {
 return;
 }
 if (!this.childrenInjected) {
 kinderGarten.append(...this.childNodes);
 this.childrenInjected = true;
 return;
 }
 kinderGarten.append(this._storedChildren);
 }
 
 async loadContent(canUseMemoized) {
 const { fragmentRoot } = this.internal.fragment;
 const isFragmentRoot = this.internal.fragment.enabled;
 const isFragmentElement = !!fragmentRoot;
 const isFragmentRootEnabled = fragmentRoot?.internal.fragment.enabled;
 if (!isFragmentRoot && isFragmentElement && !isFragmentRootEnabled) {
 return false;
 }
 const componentName = this.__componentName;
 const url = `${CONST.componentRoute.html}/${componentName}`;
 let html;
 if (canUseMemoized) {
 html = await fetchWithCache(url, this.root);
 } else {
 const response = await fetch(url);
 if (!response.ok) {
 throw CONST.error.failedToFetchHTML(componentName);
 }
 html = await response.text();
 this.root.__fetchCache.set(url, html);
 }
 const fragment = parseHTML(html, this);
 if (!this.internal.fragment.enabled) {
 this.shadowRoot.replaceChildren();
 }
 this.appendChildren(fragment);
 if (this.internal.fragment.enabled) {
 this.internal.fragment.content = fragment;
 } else {
 this.shadowRoot.appendChild(fragment);
 }
 if (isFragmentElement || isFragmentRoot) {
 for (const child of this.internal.children) {
 child.connectedCallback();
 }
 }
 return true;
 }
 
 observeState(property) {
 const callback = {
 stateChange: (value, prevValue) =>
 this.stateChange(value, property, prevValue),
 };
 const [addObserver, removeObserver] = useObserver(
 this.__componentKey,
 property,
 this.root,
 );
 if (this.__observers.has(property)) {
 const oldRemove = this.__observers.get(property);
 oldRemove?.(this);
 }
 addObserver(callback);
 this.__observers.set(property, () => removeObserver(callback));
 }
 
 state(property, initialValue, asRef = false, avoidClone = false) {
 const state = useState(
 this.__componentKey,
 property,
 initialValue,
 asRef,
 avoidClone,
 this.root,
 );
 this.observeState(property);
 return state;
 }
 clearListeners() {
 clearAllListenersForHost(this);
 }
 
 stateChange(value, property, prevValue, isCalledByHerd = false) {
 this.#batchedChanges.push({ value, property, prevValue });
 if (!this.#pendingStateUpdate) {
 this.#pendingStateUpdate = true;
 Promise.resolve().then(() => {
 const changes = this.#batchedChanges;
 this.#batchedChanges = [];
 this.#pendingStateUpdate = false;
 this.__mountCallback(
 isCalledByHerd
 ? CONST.reason.herdUpdate(changes)
 : CONST.reason.stateChange(changes),
 );
 });
 }
 }
 dispatchEvent(event) {
 window.dispatchEvent(event);
 }
 
 async runScript(reason) {
 try {
 const { script } = await fetchComponentData(
 this.__componentName,
 [CONST.componentRoute.script],
 this.root,
 CONST.reasonCache(reason),
 );
 if (!script) {
 return;
 }
 const tags = extractComponentTagsFromString(script.toString());
 await this.root?.loadCustomComponents(tags);
 scriptRunner(this, script, reason);
 } catch (error) {
 console.pig(
 CONST.pigletLogs.errorLoadingScript,
 CONST.coreLogsLevels.warn,
 error,
 );
 }
 }
}
export default ReactiveComponent;