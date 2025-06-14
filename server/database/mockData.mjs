import { generateRandomPolishGeoLocation } from "../api/helpers.mjs";
import { hashPassword } from "@/server/database/password";

const passwordToMock = "password123";

const mockData = {
  roles: [
    {
      name: "user",
      description: "Standard user with basic permissions",
      permissions: "007", // Default permissions for 'user' role
    },
    {
      name: "admin",
      description: "Administrator with full permissions",
      permissions: "777", // Full permissions for 'admin' role
    },
    {
      name: "guest",
      description: "Guest user with limited permissions",
      permissions: "004", // Limited permissions for 'guest' role
    },
  ],
  geoLocations: [
    {
      id: 0,
      ...generateRandomPolishGeoLocation(),
      city: null,
    },
    {
      id: 1,
      ...generateRandomPolishGeoLocation(),
      city: null,
    },
    {
      id: 2,
      ...generateRandomPolishGeoLocation(),
      city: null,
    },
    {
      id: 3,
      ...generateRandomPolishGeoLocation(),
      city: null,
    },
  ],
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
      geoLocationId: 0,
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
      geoLocationId: 1,
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
      geoLocationId: 2,
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
      geoLocationId: 3,
      authorId: 3,
      image: "/public/images/reports/report_3.png",
    },
  ],
  users: [
    {
      id: 0,
      email: "test@user.com",
      password: hashPassword(passwordToMock),
    },
    {
      id: 1,
      email: "test2@user.com",
      password: hashPassword(passwordToMock),
    },
    {
      id: 2,
      email: "test3@user.com",
      password: hashPassword(passwordToMock),
      role: "admin", // Mocking an admin user
    },
    {
      id: 3,
      email: "test4@user.com",
      password: hashPassword(passwordToMock),
    },
  ],
  activeSessions: new Map(),
  comments: [
    {
      id: 1,
      reportId: 0,
      authorId: 1,
      content:
        "I noticed the pollution levels are particularly high near the playground area. We need to take action quickly.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      updatedAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    },
    {
      id: 2,
      reportId: 1,
      authorId: 2,
      content:
        "The factory emissions are affecting our health. We should report this to the local authorities.",
      createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      updatedAt: null,
    },
    {
      id: 3,
      reportId: 2,
      authorId: 3,
      content:
        "Illegal dumping is a serious issue. We need to gather more evidence and report it.",
      createdAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
      updatedAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
    },
    {
      id: 4,
      reportId: 3,
      authorId: 2,
      content:
        "Water contamination can have severe health impacts. We should escalate this issue immediately.",
      createdAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
      updatedAt: null,
    },
    {
      id: 5,
      reportId: 0,
      authorId: 3,
      content:
        "I agree, the air quality is deteriorating. We need to raise awareness in the community.",
      createdAt: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
      updatedAt: null,
    },
    {
      id: 6,
      reportId: 1,
      authorId: 1,
      content:
        "Let's organize a community meeting to discuss this issue and find solutions.",
      createdAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
      updatedAt: null,
    },
    {
      id: 7,
      reportId: 2,
      authorId: 0,
      content:
        "I have seen similar issues in other areas. We should collaborate with environmental groups.",
      createdAt: Date.now() - 1000 * 60 * 60, // 1 hour ago
      updatedAt: null,
    },
    {
      id: 8,
      reportId: 3,
      authorId: 1,
      content:
        "The local government needs to take this seriously. We should petition for action.",
      createdAt: Date.now() - 1000 * 60 * 60 * 6, // 6 hours ago
      updatedAt: null,
    },
  ],
};

export default mockData;
