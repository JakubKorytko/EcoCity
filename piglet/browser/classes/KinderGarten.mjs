import ReactiveDummyComponent from "@Piglet/browser/classes/ReactiveDummyComponent";
class KinderGarten extends ReactiveDummyComponent {
 connectedCallback() {
 super.connectedCallback();
 }
 disconnectedCallback() {
 this._parent._storedChildren.append(...this.childNodes);
 }
}
export default KinderGarten;