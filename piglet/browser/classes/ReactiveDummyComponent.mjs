import { useObserver } from "@Piglet/browser/hooks";
import { setNativeAttributes } from "@Piglet/browser/helpers";
class ReactiveDummyComponent extends HTMLElement {
 
 __observers = new Map();
 
 shouldBatchRefUpdates = true;
 #pendingStateUpdate = false;
 #pendingRefUpdate = false;
 
 _mount() {}
 constructor(attrs, root) {
 super();
 setNativeAttributes.call(this, attrs);
 this.root = root ?? this.root;
 this.__componentId = `${crypto.getRandomValues(new Uint8Array(1))}${Date.now()}`;
 this.__componentKey = `dummy-${this.__componentId}`;
 this.attrs = attrs ?? {};
 this._parent = this.attrs.parent ?? undefined;
 this.classList.add(this.__componentKey);
 this.createStyleTag(
 `@layer {.${this.__componentKey} {display: contents;}}`,
 );
 }
 
 createStyleTag(textContent) {
 const style = document.createElement("style");
 style.setAttribute("data-piglet-persistent", "");
 style.textContent = textContent;
 this.append(style);
 }
 
 connectedCallback() {
 const parent = this._parent?.internal;
 if (parent?.mounted) {
 this._mount();
 } else {
 parent?.waiters.push(this);
 }
 }
 
 observeState(property) {
 const callback = {
 stateChange: (value, prevValue) =>
 this.stateChange(value, property, prevValue),
 refChange: (value, prevValue) =>
 this.refChange(value, property, prevValue),
 };
 const [addObserver, removeObserver] = useObserver(
 this._parent.__componentKey,
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
 
 stateChange(value, property, prevValue) {
 if (!this.#pendingStateUpdate) {
 this.#pendingStateUpdate = true;
 Promise.resolve().then(() => {
 this.#pendingStateUpdate = false;
 if (
 prevValue !== value ||
 (typeof value === "object" && value !== null)
 ) {
 this._update(value, property, prevValue);
 }
 });
 }
 }
 
 passRefUpdate(value, property, prevValue) {
 if (prevValue !== value || (typeof value === "object" && value !== null)) {
 this._refUpdate(value, property, prevValue);
 }
 }
 
 refChange(value, property, prevValue) {
 if (!this.#pendingRefUpdate && this.shouldBatchRefUpdates) {
 this.#pendingRefUpdate = true;
 Promise.resolve().then(() => {
 this.#pendingRefUpdate = false;
 this.passRefUpdate(value, property, prevValue);
 });
 }
 if (!this.shouldBatchRefUpdates) {
 this.passRefUpdate(value, property, prevValue);
 }
 }
 dispatchEvent(event) {
 return false;
 }
}
export default ReactiveDummyComponent;