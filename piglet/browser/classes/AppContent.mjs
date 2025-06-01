import ReactiveDummyComponent from "@Piglet/browser/classes/ReactiveDummyComponent";
class AppContent extends ReactiveDummyComponent {
 constructor() {
 super();
 }
 
 async runPageTransition(inOrOut = "in", duration = 100) {
 const animationFrames = [
 { opacity: "0", filter: "blur(5rem)" },
 { opacity: "1", filter: "blur(0)" },
 ];
 const animationOptions = {
 easing: "ease-in-out",
 duration,
 fill: "forwards",
 };
 const animation = this.animate(
 inOrOut === "in" ? animationFrames : animationFrames.reverse(),
 animationOptions,
 );
 await animation.finished;
 }
 connectedCallback() {
 super.connectedCallback();
 }
}
export default AppContent;