const extractComponentTagsFromString = (html) => {
 const componentTags = new Set();
 const tagRegex = /<([A-Z][a-zA-Z0-9]*)\b/g;
 let match;
 while ((match = tagRegex.exec(html)) !== null) {
 componentTags.add(match[1]);
 }
 return Array.from(componentTags);
};
const toPascalCase = function (str) {
 return str
 .split(/[-_]/)
 .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
 .join("");
};
const toKebabCase = function (str) {
 return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
};
export { extractComponentTagsFromString, toPascalCase, toKebabCase };