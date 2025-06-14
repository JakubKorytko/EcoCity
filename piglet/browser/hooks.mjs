import { createStateIfMissing, sendToExtension } from "@Piglet/browser/helpers";
import CONST from "@Piglet/browser/CONST";
const useState = (
 componentName,
 path,
 initialValue,
 asRef,
 avoidClone = false,
 root,
) => {
 const key = Array.isArray(path) ? path.join(".") : path;
 createStateIfMissing(
 componentName,
 key,
 initialValue,
 asRef,
 avoidClone,
 root,
 );
 
 return {
 
 get value() {
 return root.globalState?.[componentName]?.[key]?.state;
 },
 
 set value(newValue) {
 createStateIfMissing(
 componentName,
 key,
 newValue,
 asRef,
 avoidClone,
 root,
 );
 root.globalState[componentName][key].setState(newValue);
 sendToExtension(CONST.extension.state, root);
 },
 };
};
const useObserver = function (componentName, path, root) {
 const key = Array.isArray(path) ? path.join(".") : path;
 if (
 !root.globalState[componentName] ||
 !root.globalState[componentName][key]
 ) {
 return [() => {}, () => {}];
 }
 const state = root.globalState[componentName][key];
 return [state.addObserver.bind(state), state.removeObserver.bind(state)];
};
export { useState, useObserver };