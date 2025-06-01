import ReactiveComponent from "@Piglet/browser/classes/ReactiveComponent";
const buildComponentTree = function (node) {
 
 const getNodeKey = function (node) {
 if (node instanceof ReactiveComponent) {
 return node.__componentKey;
 }
 return `[HTML]${node.tagName}`;
 };
 
 const recurse = function (currentNode) {
 const result = {};
 const children = [];
 if (currentNode.children && currentNode.children.length > 0) {
 children.push(...currentNode.children);
 }
 if (currentNode.shadowRoot && currentNode.shadowRoot.children.length > 0) {
 children.push(...currentNode.shadowRoot.children);
 }
 for (const child of children) {
 const key = getNodeKey(child);
 result[key] = recurse(child);
 }
 return result;
 };
 return {
 [getNodeKey(node)]: recurse(node),
 };
};
export { buildComponentTree };