import { sleep } from "/modules/helpers.pig";
import CookieManager from "/modules/CookieManager.pig";
import { transition } from "/modules/helpers.pig";

const excludedRoutes = ["/signin", "/signup"];

$H.observe("route");
$H.observe("user");

if (!$H.route) {
  throw out;
}

const logout = async () => {
  await $api("/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${CookieManager.get("session")}` },
  });
  transition(() => {
    $H.user = { email: "", name: "Unknown User", role: "guest", token: "" };
    $H.isAuthenticated = false;
  });
};

$onBeforeUpdate(() => {
  $element(".logout")?.off("click", logout);
});

$element(".logout")?.on("click", logout);

const setAvatar = () => {
  const avatar = $element(".avatar", HTMLImageElement.prototype);
  if (avatar)
    avatar.src = $H.user?.avatar ?? "/public/images/avatars/placeholder.png";
};

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
  setAvatar();
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
    }
    setAvatar();
  })();
  $B.shouldDisplayNavBar = shouldDisplayNavBarBasedOnNewRoute;
}
