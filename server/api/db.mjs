import {
  generateRandomPolishGeoLocation,
  getCityNameFromCoords,
} from "@/server/api/helpers";

const db = {
  userDetails: [
    {
      id: 0,
      name: "John Doe",
      avatar: "/public/images/avatars/user_0.jpg",
    },
    {
      id: 1,
      name: "Mike Chen",
      avatar: "/public/images/avatars/user_1.jpg",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      avatar: "/public/images/avatars/user_2.jpg",
    },
    {
      id: 3,
      name: "David Park",
      avatar: "/public/images/avatars/user_3.jpg",
    },
  ],
  reports: [
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
  ],
  users: [
    {
      id: 0,
      email: "test@user.com",
      password: "password123",
    },
  ],
  activeSessions: new Map(),
};

db.reports.forEach((report) => {
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

export default db;
