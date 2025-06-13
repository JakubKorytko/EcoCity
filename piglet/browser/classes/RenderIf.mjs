import { getDeepValue } from "@Piglet/browser/helpers";
import CONST from "@Piglet/browser/CONST";
import ReactiveDummyComponent from "@Piglet/browser/classes/ReactiveDummyComponent";
import State from "@Piglet/browser/classes/State";
class RenderIf extends ReactiveDummyComponent {
 static get observedAttributes() {
 return [CONST.conditionAttribute];
 }
 
 _condition;
 
 _negated = false;
 
 _parts = [];
 
 _contentFragment = document.createDocumentFragment();
 
 _contentMounted = true;
 
 shouldBatchRefUpdates = false;
 
 _moveChildrenToFragment() {
 this._contentFragment.append(...this.childNodes);
 }
 
 attributeChangedCallback(name, oldValue, newValue) {
 if (
 name === CONST.conditionAttribute &&
 oldValue !== newValue &&
 this._parent
 ) {
 this._updateFromAttribute();
 }
 }
 
 _updateFromAttribute() {
 let conditionProperty = this.attrs.condition;
 if (typeof conditionProperty !== "string") {
 if (conditionProperty instanceof State) {
 this._state = conditionProperty;
 super.observeState(conditionProperty);
 this._updateCondition(this._state);
 return;
 }
 this._updateCondition(conditionProperty);
 return;
 }
 this._negated = false;
 if (conditionProperty.startsWith("!")) {
 this._negated = true;
 conditionProperty = conditionProperty.substring(1);
 }
 if (
 /^true$/i.test(conditionProperty) ||
 /^false$/i.test(conditionProperty)
 ) {
 this._condition = /^true$/i.test(conditionProperty);
 this.updateVisibility();
 return;
 }
 let state = this.root.globalState[this._parent.__componentKey];
 let isUsingHerd = false;
 if (conditionProperty.startsWith("H$")) {
 state = this.root.herd.globalState;
 conditionProperty = conditionProperty.substring(2);
 isUsingHerd = true;
 } else if (!conditionProperty.startsWith("$")) {
 this._condition = true;
 this.updateVisibility();
 return;
 } else {
 conditionProperty = conditionProperty.substring(1);
 }
 const parts = conditionProperty.split(".");
 const isAttribute = parts[0] === CONST.attributesObjectName;
 if (isAttribute) {
 conditionProperty = conditionProperty.replace(`${parts.shift()}.`, "");
 }
 if (parts.length > 1) {
 if (!isAttribute) {
 this._parts = parts.slice(1);
 }
 conditionProperty = parts[0];
 } else {
 this._parts = [];
 }
 if (isAttribute) {
 this._updateCondition(
 this._parent.attrs[conditionProperty] ??
 this._parent.attrs[conditionProperty.toLowerCase()],
 );
 } else {
 if (!state?.[conditionProperty]) {
 console.pig(
 CONST.pigletLogs.conditionNotFoundInState(conditionProperty),
 CONST.coreLogsLevels.warn,
 );
 this._condition = false;
 this.updateVisibility();
 return;
 }
 this._state = state[conditionProperty]._state;
 if (isUsingHerd) {
 this.root.herd.observe(this, conditionProperty);
 } else {
 super.observeState(conditionProperty);
 }
 this._updateCondition(this._state);
 }
 }
 
 _updateCondition(value) {
 const innerValue = getDeepValue(value, this._parts);
 this._condition = Boolean(innerValue);
 if (this._negated) {
 this._condition = !this._condition;
 }
 this.updateVisibility();
 }
 
 updateVisibility() {
 if (this._condition && !this._contentMounted) {
 this.append(this._contentFragment);
 this._contentMounted = true;
 } else if (!this._condition && this._contentMounted) {
 this._moveChildrenToFragment();
 this._contentMounted = false;
 }
 }
 
 _mount(reason) {
 this._updateFromAttribute();
 return Promise.all([true]);
 }
 
 _update(value) {
 this._updateCondition(value);
 }
 
 _refUpdate(value) {
 this._updateCondition(value);
 }
}
export default RenderIf;