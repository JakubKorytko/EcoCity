import { sleep } from "/modules/helpers.pig";

const excludedRoutes = ["/signin", "/signup"];

$H.observe("route");

if (!$H.route) {
  throw out;
}

const updateCurrentPage = (newRoute) => {
  const route = newRoute || $H.route;

  $B.currentPage = {
    home: route === "/",
    reports: route === "/reports" || route === "/report",
    dashboardOrNew: route === "/dashboard" || route === "/report/add",
  };
};

const hiddenNavBarStyles = [
  ["margin-top", "-72px"],
  ["display", "none"],
];

$B.firstRender = $$(true);

$B.shouldDisplayNavBar = $$(!excludedRoutes.includes($H.route));

if ($B.firstRender) {
  if (!$B.shouldDisplayNavBar) {
    $this.style.setProperty(...hiddenNavBarStyles.at(0));
  }
  updateCurrentPage();

  $B.firstRender = false;
} else {
  const shouldDisplayNavBarBasedOnNewRoute = !excludedRoutes.includes($H.route);

  (async () => {
    if ($B.shouldDisplayNavBar && !shouldDisplayNavBarBasedOnNewRoute) {
      this.style.setProperty(...hiddenNavBarStyles.at(0));
      await sleep(300);
      this.style.setProperty(...hiddenNavBarStyles.at(1));
    } else if (!$B.shouldDisplayNavBar && shouldDisplayNavBarBasedOnNewRoute) {
      updateCurrentPage();
      this.style.removeProperty("display");
      requestAnimationFrame(() => this.style.removeProperty("margin-top"));
    } else {
      $element("main")?.style.setProperty("transform", "scaleX(0)");
      await sleep(200);
      updateCurrentPage();
      $element("main")?.style.removeProperty("transform");

      console.log("got here", $element("main")?.style);
    }
  })();
  $B.shouldDisplayNavBar = shouldDisplayNavBarBasedOnNewRoute;
}
