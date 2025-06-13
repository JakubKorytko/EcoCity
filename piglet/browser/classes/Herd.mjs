import {
 createNestedStateProxy,
 createStateProxy,
 sendToExtension,
} from "@Piglet/browser/helpers";
import State from "@Piglet/browser/classes/State";
import CONST from "@Piglet/browser/CONST";
const observerProxyFactory = (originalProxy, herd, component) =>
 new Proxy(
 { component, herd, originalProxy },
 {
 get(target, prop) {
 if (prop === "observe")
 return herd.observe.bind(herd, target.component);
 return Reflect.get(originalProxy, prop);
 },
 set(target, prop, value) {
 if (prop !== "observe") Reflect.set(originalProxy, prop, value);
 return true;
 },
 },
 );
class Herd {
 
 states = {};
 
 globalState = new Proxy(
 {},
 {
 get: (target, prop) => {
 if (prop === this.__componentKey) return target;
 return Reflect.get(target, prop);
 },
 set: (target, prop, value) => {
 if (prop !== this.__componentKey) Reflect.set(target, prop, value);
 return true;
 },
 },
 );
 
 observerWaiters = new Map();
 
 observers = new Map();
 
 __componentKey = "HERD"; // pseudo componentKey for global state
 
 __componentName = "Herd";
 
 __proxyCache = new WeakMap();
 
 shallow;
 
 deep;
 
 root = this;
 constructor(root) {
 this._shallow = createStateProxy(false, this);
 this._deep = createNestedStateProxy(false, this);
 this.shallow = (target) =>
 observerProxyFactory(this._shallow, this, target);
 this.deep = (target) => observerProxyFactory(this._deep, this, target);
 this.originalRoot = root;
 }
 
 state(path, initialValue, asRef = false, avoidClone = false) {
 const key = Array.isArray(path) ? path.join(".") : path;
 if (!this.globalState[key]) {
 this.globalState[key] = new State(initialValue, asRef, avoidClone);
 }
 const root = this;
 const state = {
 get value() {
 return root.globalState[key].state;
 },
 set value(newValue) {
 root.globalState[key].setState(newValue);
 sendToExtension(CONST.extension.state, root);
 },
 };
 const components = this.observerWaiters.get(key) ?? [];
 for (const component of components) {
 this.observe(component, key);
 if (component.constructor.name === "RenderIf") {
 component._updateFromAttribute();
 }
 }
 this.observerWaiters.delete(key);
 return state;
 }
 
 observe(componentInstance, key) {
 const componentKey = componentInstance.__componentKey;
 const stateChange = componentInstance.stateChange.bind(componentInstance);
 const observerKey = `${componentKey}${key}`;
 if (this.observers.has(observerKey) || !key) return;
 const callback = {
 stateChange: (value, prevValue) => {
 stateChange(value, key, prevValue, true);
 },
 };
 const observerWaiters = this.observerWaiters.get(key) ?? [];
 if (
 !this.globalState[key] &&
 !observerWaiters.includes(componentInstance)
 ) {
 this.observerWaiters.set(key, [...observerWaiters, componentInstance]);
 return;
 }
 const state = this.globalState[key];
 const [addObserver, removeObserver] = [
 state.addObserver.bind(state),
 state.removeObserver.bind(state),
 ];
 if (this.observers.has(observerKey)) {
 const oldRemove = this.observers.get(observerKey);
 oldRemove?.(this);
 }
 addObserver(callback);
 this.observers.set(observerKey, () => removeObserver(callback));
 }
 
 unobserve(componentInstance, property) {
 const { __componentKey: componentKey } = componentInstance;
 const observerKey = `${componentKey}${property}`;
 const remover = this.observers.get(observerKey);
 if (remover) {
 remover(this);
 this.observers.delete(observerKey);
 }
 }
}
export default Herd;