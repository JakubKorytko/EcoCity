import ReactiveDummyComponent from "@Piglet/browser/classes/ReactiveDummyComponent";
class NavLink extends ReactiveDummyComponent {
 static get observedAttributes() {
 return ["to"];
 }
 constructor(attrs, root) {
 super(attrs, root);
 this.handleClick = this.handleClick.bind(this);
 this.updateActiveState = this.updateActiveState.bind(this);
 }
 connectedCallback() {
 super.connectedCallback();
 this.setAttribute("role", "link");
 this.style.cursor = "pointer";
 this.addEventListener("click", this.handleClick);
 window.addEventListener("popstate", this.updateActiveState);
 this.updateActiveState();
 }
 disconnectedCallback() {
 this.removeEventListener("click", this.handleClick);
 window.removeEventListener("popstate", this.updateActiveState);
 }
 
 attributeChangedCallback(name, oldValue, newValue) {
 if (name === "to" && oldValue !== newValue) {
 this.attrs[name] = newValue;
 this.updateActiveState();
 }
 }
 
 handleClick(event) {
 this.root.navigate(this.attrs.to);
 this.updateActiveState();
 }
 
 updateActiveState() {
 const currentPath = window.location.pathname;
 if (currentPath === this.attrs.to) {
 this.classList.add("active");
 } else {
 this.classList.remove("active");
 }
 }
}
export default NavLink;