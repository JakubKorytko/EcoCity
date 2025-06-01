import { spawn } from "child_process";
import { pathToFileURL } from "url";
import fs from "fs";
import CONST from "../misc/CONST.mjs";
const runApplication = (rootDir, prod) => {
 spawn(
 "node",
 [
 "--import",
 `"data:text/javascript,${encodeURIComponent(
 fs
 .readFileSync(
 `./${CONST.dirPath(prod)}/watcher/loader-arg.mjs`,
 "utf8",
 )
 .toString()
 .replace("__dirname", `./${CONST.dirPath(prod)}/watcher/loader.mjs`),
 )}"`,
 `./${CONST.dirPath(prod)}/watcher/index.mjs`,
 `--rootDir="${pathToFileURL(rootDir)}"`,
 ],
 {
 env: {
 NODE_ENV: prod ? "production" : "development",
 },
 stdio: "inherit",
 shell: true,
 },
 );
};
export default runApplication;