const reports = [
  {
    id: 0,
    title: "Big Air Pollution in Central Park",
    description:
      "High levels of air pollution detected in Central Park, affecting local wildlife and residents.",
    status: "Resolved",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    updatedAt: Date.now() - 1000 * 60 * 60 * 25, // 1 day and 1 hour ago
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
    authorId: 3,
    image: "/public/images/reports/report_3.png",
  },
];

export default async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(reports));
};
