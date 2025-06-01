import CONST from "@Piglet/browser/CONST";
const { nestedDeepProxyMarker, setViaGetterMarker } = CONST.symbols;
class State {
 
 _state;
 
 __observers = [];
 
 _isRef;
 constructor(initialValue, asRef = false, avoidClone = false) {
 this._avoidClone = avoidClone;
 this._state =
 initialValue?.[1] === nestedDeepProxyMarker
 ? initialValue[0]
 : this.cloneState(initialValue);
 this._isRef = asRef;
 }
 
 addObserver(observer) {
 this.__observers.push(observer);
 }
 
 removeObserver(observer) {
 this.__observers = this.__observers.filter((obs) => obs !== observer);
 }
 
 get state() {
 return this._state;
 }
 
 setState(newState) {
 const oldState = this._state;
 this._state =
 newState?.[1] === nestedDeepProxyMarker
 ? newState[0]
 : this.cloneState(newState);
 if (!this._isRef) {
 this._notify(oldState);
 } else {
 this._notifyRef(oldState);
 }
 }
 
 cloneState(state) {
 if (this._avoidClone || state === setViaGetterMarker) {
 return state;
 }
 let clone = state;
 try {
 clone = structuredClone(state);
 } catch (error) {
 console.pig(CONST.pigletLogs.cloneWarning, CONST.coreLogsLevels.warn, {
 error,
 state,
 });
 }
 return clone;
 }
 
 _notify(oldState) {
 this.__observers.forEach((observer) =>
 observer.stateChange(this._state, oldState),
 );
 }
 
 _notifyRef(oldState) {
 this.__observers.forEach((observer) => {
 if (typeof observer.refChange === "function") {
 observer.refChange(this._state, oldState);
 }
 });
 }
}
export default State;