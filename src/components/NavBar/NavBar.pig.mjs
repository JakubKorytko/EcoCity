import { sleep } from "/modules/helpers.pig";

const excludedRoutes = ["/signin", "/signup"];

const hiddenNavBarStyles = [
  ["margin-top", "-72px"],
  ["display", "none"],
];

$H.route = $$(document.location.pathname);

$H.observe("route");

$B.currentPage = {
  home: $H.route === "/",
  reports: $H.route === "/reports",
  dashboardOrNew: $H.route === "/dashboard" || $H.route === "/report/add",
};

$B.firstRender = $$(true);

$B.shouldDisplayNavBar = $$(!excludedRoutes.includes($H.route));

if ($B.firstRender) {
  if (!$B.shouldDisplayNavBar) {
    $this.style.setProperty(...hiddenNavBarStyles.at(0));
  }

  $B.firstRender = false;
}

const main = $element("main");

main?.style.removeProperty("transform");

const onPopState = async () => {
  const newRoute = document.location.pathname;
  const shouldDisplayNavBarBasedOnNewRoute = !excludedRoutes.includes(newRoute);

  if ($B.shouldDisplayNavBar && !shouldDisplayNavBarBasedOnNewRoute) {
    this.style.setProperty(...hiddenNavBarStyles.at(0));
    await sleep(300);
    this.style.setProperty(...hiddenNavBarStyles.at(1));
  } else if (!$B.shouldDisplayNavBar && shouldDisplayNavBarBasedOnNewRoute) {
    this.style.removeProperty("display");
    requestAnimationFrame(() => this.style.removeProperty("margin-top"));
  } else {
    main?.style.setProperty("transform", "scaleX(0)");
    await sleep(200);
  }

  $B.shouldDisplayNavBar = shouldDisplayNavBarBasedOnNewRoute;
  $H.route = newRoute;
};

window.addEventListener("popstate", onPopState);

$onBeforeUpdate(() => {
  window.removeEventListener("popstate", onPopState);
});
