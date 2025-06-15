import { sleep } from "/modules/helpers.pig";
import CookieManager from "/modules/CookieManager.pig";
import { transition } from "/modules/helpers.pig";

const excludedRoutes = ["/signin", "/signup"];

$H.observe("route");
$H.observe("user");

if (!$H.route || !$H.user) {
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

const setListenersAndContent = () => {
  const avatar = $element(".avatar", HTMLImageElement.prototype);
  if (avatar)
    avatar.src = $H.user?.avatar ?? "/public/images/avatars/placeholder.png";
  const userName = $element(".username", HTMLSpanElement.prototype);
  if (userName) userName.textContent = $H.user?.name ?? "Unknown User";
  $element(".logout")?.on("click", logout);
};

const updateCurrentPage = (newRoute) => {
  const route = (newRoute || $H.route).split("?")[0];

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

  setListenersAndContent();
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
      $element("main")?.style.setProperty("opacity", "0");
      await sleep(200);
      updateCurrentPage();
      $element("main")?.style.removeProperty("opacity");
    }
    setListenersAndContent();
  })();
  $B.shouldDisplayNavBar = shouldDisplayNavBarBasedOnNewRoute;
}
