import {
  generateRandomPolishGeoLocation,
  getCityNameFromCoords,
} from "@/server/api/helpers";

const reports = [
  {
    id: 0,
    title: "Big Air Pollution in Central Park",
    description:
      "High levels of air pollution detected in Central Park, affecting local wildlife and residents.",
    status: "Resolved",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 25, // 1 day and 1 hour ago
    geoLocation: generateRandomPolishGeoLocation(),
    authorId: 0,
    image: "/public/images/reports/report_0.jpg",
  },
  {
    id: 1,
    title: "Factory Air Pollution",
    description:
      "Heavy smoke emission from industrial area affecting local air quality.",
    status: "New",
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    updatedAt: null,
    geoLocation: generateRandomPolishGeoLocation(),
    authorId: 1,
    image: "/public/images/reports/report_1.png",
  },
  {
    id: 2,
    title: "Illegal Dumping at River Park",
    description:
      "Large amounts of construction waste found near the riverside park.",
    status: "Pending",
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    geoLocation: generateRandomPolishGeoLocation(),
    authorId: 2,
    image: "/public/images/reports/report_2.jpg",
  },
  {
    id: 3,
    title: "Water Contamination",
    description:
      "Chemical discharge detected in local stream causing health concerns.",
    status: "New",
    createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    updatedAt: null,
    geoLocation: generateRandomPolishGeoLocation(),
    authorId: 3,
    image: "/public/images/reports/report_3.png",
  },
];

reports.forEach((report) => {
  if (report.geoLocation.city) return; // Skip if city is already set
  const { latitude, longitude } = report.geoLocation;
  getCityNameFromCoords(latitude, longitude)
    .then((city) => {
      report.geoLocation.city = city;
    })
    .catch((error) => {
      console.warn(`Failed to get city name for report ${report.id}:`, error);
      report.geoLocation.city = "Unknown";
    });
});

export default async (req, res) => {
  const params = Object.fromEntries(
    new URLSearchParams(req.url.split("?")[1]).entries(),
  );

  const { from, to, id } = params;

  if (id) {
    const reportId = parseInt(id);
    const report = reports.find((report) => report.id === reportId);

    if (!report) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "Report not found" }));
      return;
    }

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(report));
    return;
  }

  const paginatedReports = reports.slice(
    from ? Math.max(parseInt(from), 0) : 0,
    to ? Math.min(parseInt(to) + 1, reports.length) : reports.length,
  );

  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(paginatedReports));
};
