import CONST from "../misc/CONST.mjs";
import path from "path";
const isProd = process.env.NODE_ENV === "production";
function resolvePath(inputPath) {
 if (inputPath.startsWith("@/") || inputPath.startsWith("@Piglet/")) {
 const modifiedPath = inputPath.replace(
 "@Piglet/",
 `@/${CONST.dirPath(isProd)}/`,
 );
 const aliasPath = modifiedPath.replace("@/", "");
 if (
 !Object.keys(CONST.directories).some((alias) =>
 aliasPath.startsWith(alias),
 )
 ) {
 return path.resolve(CONST.directories["@"], aliasPath);
 }
 for (const alias in CONST.directories) {
 if (aliasPath.startsWith(`${alias}/`) || aliasPath === alias) {
 const newPath = modifiedPath.replace(
 `@/${alias}`,
 CONST.directories[alias],
 );
 return path.resolve(newPath);
 }
 }
 }
 return path.resolve(inputPath);
}
const getRootDirFromArgv = (processArgvArray) => {
 const arg = processArgvArray.find((value) => value.startsWith("--rootDir="));
 return arg ? arg.replace("--rootDir=", "") : null;
};
export { resolvePath, getRootDirFromArgv };