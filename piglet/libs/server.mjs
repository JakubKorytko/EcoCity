import http from "http";
import console from "@Piglet/utils/console";
import { proxyHandler, serverHandler } from "@Piglet/libs/helpers";
import {
 runReloadClientOnWSMessageListener,
 socketHandler,
} from "@Piglet/libs/socket";
import coreControllers from "@Piglet/controllers/index";
const createServer = () => {
 runReloadClientOnWSMessageListener();
 const server = new Proxy(http.createServer(serverHandler), proxyHandler);
 server.middleware = (callback) => {
 server.customRoutes.middleware = callback;
 };
 server.on("upgrade", socketHandler);
 server.customRoutes = {
 ...coreControllers,
 };
 return server;
};
export default createServer();