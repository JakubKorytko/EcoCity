import crypto from "crypto";
import { clientsRef } from "@Piglet/libs/clientsRef";
function createWsMessage(payload) {
 const json = JSON.stringify(payload);
 const payloadBuf = Buffer.from(json);
 const length = payloadBuf.length;
 if (length < 126) {
 return Buffer.concat([Buffer.from([0x81, length]), payloadBuf]);
 } else if (length < 65536) {
 return Buffer.concat([
 Buffer.from([0x81, 126, length >> 8, length & 0xff]),
 payloadBuf,
 ]);
 } else {
 throw new Error("Payload too long");
 }
}
const socketHandler = (req, socket) => {
 const key = req.headers["sec-websocket-key"];
 const acceptKey = crypto
 .createHash("sha1")
 .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
 .digest("base64");
 const headers = [
 "HTTP/1.1 101 Switching Protocols",
 "Upgrade: websocket",
 "Connection: Upgrade",
 `Sec-WebSocket-Accept: ${acceptKey}`,
 ];
 socket.write(headers.join("\r\n") + "\r\n\r\n");
 clientsRef.instance.push(socket);
 socket.on("close", () => {
 const i = clientsRef.instance.indexOf(socket);
 if (i !== -1) clientsRef.instance.splice(i, 1);
 });
};
const reloadClients = (data) =>
 sendMessageToSocketClients(createWsMessage({ type: "reload", data }));
const tellClientsAboutServerRestart = () => {
 sendMessageToSocketClients(createWsMessage({ type: "serverRestart" }));
};
const fullReload = () => {
 sendMessageToSocketClients(createWsMessage({ type: "fullReload" }));
};
const sendMessageToSocketClients = (message) => {
 clientsRef.instance.forEach((sock) => {
 sock.write(message, (err) => {
 if (err) {
 sock.destroy();
 }
 });
 });
};
const runReloadClientOnWSMessageListener = () =>
 process.on("message", (msg) => {
 if (
 typeof msg === "object" &&
 msg !== null &&
 "type" in msg &&
 msg.type === "reload"
 ) {
 reloadClients();
 } else if (
 typeof msg === "object" &&
 msg !== null &&
 "type" in msg &&
 msg.type === "serverRestart"
 ) {
 tellClientsAboutServerRestart();
 }
 });
export {
 socketHandler,
 runReloadClientOnWSMessageListener,
 reloadClients,
 tellClientsAboutServerRestart,
 fullReload,
};