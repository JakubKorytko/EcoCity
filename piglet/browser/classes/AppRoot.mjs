import ReactiveComponent from "@Piglet/browser/classes/ReactiveComponent";
import {
 api,
 fetchComponentData,
 navigate,
 sendToExtension,
 toPascalCase,
} from "@Piglet/browser/helpers";
import CONST from "@Piglet/browser/CONST";
import { buildComponentTree } from "@Piglet/browser/tree";
import ReactiveDummyComponent from "@Piglet/browser/classes/ReactiveDummyComponent";
import Herd from "@Piglet/browser/classes/Herd";
let Parser;
const RouteEvent = function (detail, type) {
 return new CustomEvent(type, {
 detail,
 });
};
class AppRoot extends ReactiveComponent {
 
 _route = "";
 
 _layoutPaths = {};
 
 __previousLayout = "";
 
 __proxyCache = new WeakMap();
 
 __fetchCache = new Map();
 
 __fetchQueue = new Map();
 
 componentCounter = 0;
 
 globalState = {};
 
 extension = {};
 
 mountedComponents = new Set();
 
 constructedComponents = {};
 
 registeredComponents = {};
 
 previousFetchComponentCacheKeys = {};
 
 types = {
 RC: ReactiveComponent,
 RDC: ReactiveDummyComponent,
 };
 
 @Parser _routes = {};
 
 __navigationQueue = [];
 
 __navigatorId = 0;
 
 __routeCandidate = "";
 static get observedAttributes() {
 return [CONST.routeAttribute];
 }
 constructor(attrs) {
 super(attrs);
 if (AppRoot.instance) return AppRoot.instance;
 AppRoot.instance = this;
 this.herd = new Herd(this);
 this.api = api;
 this.navigate = navigate.bind(this);
 this.addPopStateListener();
 Object.defineProperties(window.location, {
 
 route: {
 get: () => this._route,
 },
 
 candidate: {
 get: () => this.__routeCandidate,
 },
 });
 }
 
 connectedCallback() {
 this.appContent = document.createElement("app-content");
 this.appContent.root = this;
 this.appContent.setAttribute("part", "app-content");
 this.shadowRoot.append(this.appContent);
 }
 
 async getLayoutPaths() {
 const paths = await fetch(`/component/layout/paths?noCache=${Date.now()}`);
 try {
 if (paths.ok) {
 this._layoutPaths = await paths.json();
 return;
 }
 } catch (e) {
 void 0; // Ignore JSON parsing errors
 }
 console.pig(
 CONST.pigletLogs.appRoot.errorLoading("layout paths"),
 CONST.coreLogsLevels.error,
 );
 }
 
 reset() {
 this.state = {};
 const keys = Object.keys(this.globalState);
 const constructed = keys.map((key) => this.constructedComponents[key]);
 for (const component of constructed) {
 let isInAppContent = false;
 let currentElement = component;
 while (currentElement) {
 if (currentElement === this.appContent) {
 isInAppContent = true;
 break;
 }
 currentElement = currentElement.internal?.parent;
 }
 if (isInAppContent) delete this.globalState[component.__componentKey];
 }
 this.componentCounter = 0;
 }
 
 get tree() {
 return buildComponentTree(this);
 }
 
 addPopStateListener() {
 window.addEventListener("popstate", () => {
 this.route = CONST.symbols.popStateMarker;
 });
 }
 
 attributeChangedCallback(name, oldValue, newValue) {
 if (name !== CONST.routeAttribute) return;
 if (this.route && !newValue) return this.setAttribute(name, "/");
 this.route = newValue;
 }
 
 resetBeforeTransition() {
 this.internal.mounted = true;
 const persistentChildren = this.appContent.querySelectorAll(
 "*[data-piglet-persistent]",
 );
 this.appContent.replaceChildren(...persistentChildren);
 this.reset();
 }
 
 transitionCallback({ base, layout }, isInitial = false) {
 if (!isInitial) this.resetBeforeTransition();
 this.renderComponent(base, layout);
 sendToExtension(CONST.extension.initialMessage, this.root);
 console.pig(
 CONST.pigletLogs.appRoot.routeLoaded(this.route),
 CONST.coreLogsLevels.info,
 );
 return this.appRootConnected();
 }
 
 startRouteChain(navigator, data) {
 async function* gen({ route, isInitial, isReloaded }) {
 if (isReloaded || Object.keys(this._layoutPaths).length === 0) {
 yield await this.getLayoutPaths();
 }
 const { base, layout, html } = await this.preLoadRoute(route, isReloaded);
 if (!base) return false;
 const tags = [
 ...this.extractCustomTags(html),
 ...this.extractCustomTags(layout),
 ];
 yield await this.loadCustomComponents(tags);
 if (!document.startViewTransition) {
 yield await this.appContent.runPageTransition("out");
 yield await this.transitionCallback({ base, layout }, isInitial);
 yield await this.appContent.runPageTransition();
 yield await this.appRootConnected();
 } else {
 if (window.viewTransitionRunning) {
 window.viewTransitionRunning.skipTransition();
 console.pig(
 CONST.pigletLogs.skippingViewTransition,
 CONST.coreLogsLevels.warn,
 );
 }
 if (isInitial) {
 this.resetBeforeTransition();
 }
 const currentOverflow = this.style.overflow;
 try {
 this.style.overflow = "hidden";
 const transition = document.startViewTransition(
 this.transitionCallback.bind(this, { base, layout }),
 );
 window.viewTransitionRunning = transition;
 yield await transition.ready;
 yield await transition.updateCallbackDone;
 yield await transition.finished;
 window.viewTransitionRunning = null;
 this.style.overflow = currentOverflow;
 } catch (e) {
 console.pig(
 CONST.pigletLogs.errorDuringViewTransition,
 CONST.coreLogsLevels.warn,
 e,
 );
 window.viewTransitionRunning = null;
 this.style.overflow = currentOverflow;
 yield await this.appRootConnected();
 return true;
 }
 }
 return true;
 }
 gen.bind(this);
 return new Promise(async (resolve) => {
 const generator = gen.call(this, data);
 let result = await generator.next();
 while (!result.done) {
 if (navigator.isStale) {
 console.pig(
 CONST.pigletLogs.staleNavigation,
 CONST.coreLogsLevels.warn,
 );
 return resolve(false);
 }
 result = await generator.next(result.value);
 }
 navigator.success();
 resolve(result.value);
 });
 }
 
 async preLoadRoute(route, isReloaded = false) {
 try {
 const routePath = this._routes[route] ?? "NotFound";
 const routeLayout = this._layoutPaths[routePath]?.layout;
 const isLayoutTheSame =
 routeLayout === this.__previousLayout && !isReloaded;
 this.__previousLayout = routeLayout;
 const { base, html, layout } = await fetchComponentData(
 routePath,
 [
 CONST.componentRoute.base,
 CONST.componentRoute.html,
 CONST.componentRoute.layout,
 ],
 this.root,
 isReloaded,
 );
 return {
 base,
 layout: isLayoutTheSame ? "" : layout,
 html,
 };
 } catch (err) {
 console.pig(
 CONST.pigletLogs.appRoot.errorLoading(route),
 CONST.coreLogsLevels.error,
 err,
 );
 this.appContent.innerHTML = `<h1>${CONST.pageNotFound}</h1>`;
 }
 }
 
 extractCustomTags(pageSource) {
 const tags = new Set();
 let match;
 const clonedRegex = new RegExp(CONST.tagRegex.source, "g");
 while ((match = clonedRegex.exec(pageSource)) !== null) {
 const tag = match[1];
 if (tag.includes("-") && !["app-content"].includes(tag)) {
 tags.add(tag);
 }
 }
 return Array.from(tags).map(toPascalCase);
 }
 
 async loadCustomComponents(tags, seen = new Set()) {
 await Promise.all(
 tags.map(async (tag) => {
 if (tag === CONST.conditionalName || seen.has(tag)) return;
 seen.add(tag);
 try {
 const { html } = await fetchComponentData(
 tag,
 [CONST.componentRoute.base, CONST.componentRoute.html],
 this.root,
 );
 const nestedTags = this.extractCustomTags(html);
 await this.loadCustomComponents(nestedTags, seen);
 } catch (e) {
 console.pig(
 CONST.pigletLogs.appRoot.unableToLoadComponent(tag),
 CONST.coreLogsLevels.warn,
 e,
 );
 }
 }),
 );
 }
 
 async appRootConnected() {
 this.internal.mounted = true;
 while (this.internal.waiters.length > 0) {
 await this.internal.waiters.shift()._mount(CONST.reason.parentUpdate);
 }
 }
 
 renderComponent(component, layout) {
 let contentTag = null;
 if (layout) {
 const parsedLayout = new DOMParser().parseFromString(layout, "text/html");
 const content = [
 ...parsedLayout.head.childNodes,
 ...parsedLayout.body.childNodes,
 ];
 contentTag = content.find(
 (el) => el.nodeName.toLowerCase() === "app-content",
 );
 this.shadowRoot.replaceChildren(this.appContent);
 for (const child of content) {
 let el = child;
 const tag = child.tagName?.toLowerCase();
 if (tag && tag.includes("-") && tag !== "app-content") {
 const customComponent = customElements.get(tag);
 if (customComponent) {
 el = new customComponent({ parent: this }, this.root);
 }
 }
 this.shadowRoot.appendChild(el);
 }
 }
 if (component.prototype instanceof ReactiveComponent) {
 const element = new component({ parent: this }, this);
 if (element instanceof ReactiveComponent) {
 if (contentTag) {
 contentTag.replaceWith(this.appContent);
 this.appContent.appendChild(element);
 } else {
 this.appContent.appendChild(element);
 }
 }
 }
 }
 
 createNavigator(route) {
 const id = ++this.__navigatorId;
 const entry = { route, id };
 this.__navigationQueue.push(entry);
 const condition = () => {
 const isStale =
 this.__navigationQueue[this.__navigationQueue.length - 1]?.id !== id;
 if (isStale) {
 const index = this.__navigationQueue.findIndex((e) => e.id === id);
 if (index !== -1) this.__navigationQueue.splice(index, 1);
 return false;
 }
 return true;
 };
 const status = {
 id,
 route,
 done: false,
 get isStale() {
 return !condition();
 },
 };
 status.success = () => {
 const index = this.__navigationQueue.findIndex((e) => e.id === id);
 if (index !== -1) this.__navigationQueue.splice(index, 1);
 status.done = true;
 };
 return status;
 }
 
 get route() {
 return this._route;
 }
 
 reload() {
 this.route = this._route;
 }
 
 __forceFullReload() {
 window.location.reload();
 }
 
 set route(passedRoute) {
 return new Promise(async () => {
 const native = passedRoute === CONST.symbols.popStateMarker;
 const targetRoute = native ? window.location.pathname : passedRoute;
 const routeData = {
 previousRoute: this._route,
 isInitial: this._route === "",
 native,
 redirected: false,
 };
 let testConnection;
 try {
 testConnection = await fetch(targetRoute);
 } catch {}
 const testURL = new URL(testConnection.url);
 const route = testURL.pathname;
 routeData.route = route;
 routeData.isReloaded = this._route === route;
 if (route !== targetRoute) {
 routeData.redirected = true;
 }
 this.__routeCandidate = route;
 const statusCode = String(testConnection.status)[0];
 if (["4", "5"].includes(statusCode)) {
 this.dispatchEvent(
 new RouteEvent(routeData, CONST.pigletEvents.canceledByMiddleware),
 );
 console.pig(
 CONST.pigletLogs.canceledByMiddleware(route),
 CONST.coreLogsLevels.info,
 );
 return;
 }
 const navigator = this.createNavigator(route);
 this.dispatchEvent(
 new RouteEvent(routeData, CONST.pigletEvents.beforeRouteChange),
 );
 const wasStale = !(await this.startRouteChain(navigator, routeData));
 if (wasStale) {
 return;
 }
 this._route = route;
 if (!native) {
 window.history.pushState({}, "", route);
 }
 this.dispatchEvent(
 new RouteEvent(routeData, CONST.pigletEvents.routeChanged),
 );
 });
 }
}
export default AppRoot;