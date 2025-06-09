import { sleep } from "/modules/helpers.pig";

const excludedRoutes = ["/signin", "/signup"];

const updateCurrentPage = () =>
  ($B.currentPage = {
    home: $H.route === "/",
    reports: $H.route === "/reports" || $H.route === "/report",
    dashboardOrNew: $H.route === "/dashboard" || $H.route === "/report/add",
  });

const hiddenNavBarStyles = [
  ["margin-top", "-72px"],
  ["display", "none"],
];

$H.observe("route");

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
