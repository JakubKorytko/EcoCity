const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getUrlParams = () =>
  Object.fromEntries(new URLSearchParams(window.location.search).entries());

function getReportsCount(reports) {
  return {
    total: reports.length,
    pending: reports.filter(
      (report) => report.status.toLowerCase() === "pending",
    ).length,
    resolved: reports.filter(
      (report) => report.status.toLowerCase() === "resolved",
    ).length,
  };
}

function notImplemented(actionName) {
  window.ecoCityToastManager.show({
    type: "info",
    title: actionName,
    message: "This feature is not implemented yet.",
  });
}

function getTimeDifference(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
}

function getRecentReportsArray(reports, users, count = 3) {
  if (!Array.isArray(reports) || !Array.isArray(users)) return [];

  return reports
    .sort((a, b) => {
      // Sort by updatedAt if available, otherwise use createdAt
      const timeA = a.updatedAt || a.createdAt;
      const timeB = b.updatedAt || b.createdAt;
      return timeB - timeA;
    })
    .slice(0, count)
    .map((report) => {
      const user = users.find((user) => user.id === report.authorId);
      const timeReference = report.updatedAt || report.createdAt;

      return {
        id: report.id,
        author: user ? user.name : "Unknown",
        avatarUrl: user ? user.avatar : null,
        timeDifference: getTimeDifference(timeReference),
        title: report.title,
        description: report.description,
        status: report.status,
        image: report.image,
        geoLocation: report.geoLocation,
      };
    });
}

function transition(callback) {
  if (document.startViewTransition) {
    return document.startViewTransition(callback);
  }

  return callback();
}

export {
  sleep,
  getUrlParams,
  getReportsCount,
  getTimeDifference,
  getRecentReportsArray,
  transition,
  notImplemented,
};
