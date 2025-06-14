import dbData from "./mockData.mjs";
import { getCityNameFromCoords } from "../api/helpers.mjs";

const tablesStructure = {
  roles: {
    name: "TEXT PRIMARY KEY",
    description: "TEXT",
    permissions: "TEXT",
  },

  users: {
    id: "INTEGER PRIMARY KEY",
    email: "TEXT UNIQUE",
    password: "TEXT",
    role: "TEXT DEFAULT 'user'",
    "FOREIGN KEY(role)": "REFERENCES roles(name)",
  },

  userDetails: {
    id: "INTEGER PRIMARY KEY",
    name: "TEXT",
    avatar: "TEXT",
    "FOREIGN KEY(id)": "REFERENCES users(id)",
  },

  geoLocations: {
    id: "INTEGER PRIMARY KEY",
    latitude: "REAL",
    longitude: "REAL",
    city: "TEXT",
  },

  reports: {
    id: "INTEGER PRIMARY KEY",
    title: "TEXT",
    description: "TEXT",
    status: "TEXT",
    createdAt: "INTEGER",
    updatedAt: "INTEGER",
    authorId: "INTEGER",
    geoLocationId: "INTEGER",
    image: "TEXT",
    "FOREIGN KEY(authorId)": "REFERENCES users(id)",
    "FOREIGN KEY(geoLocationId)": "REFERENCES geoLocations(id)",
  },

  activeSessions: {
    token: "TEXT PRIMARY KEY",
    userId: "INTEGER",
    email: "TEXT",
    createdAt: "INTEGER",
    "FOREIGN KEY(userId)": "REFERENCES users(id)",
  },

  comments: {
    id: "INTEGER PRIMARY KEY",
    reportId: "INTEGER",
    authorId: "INTEGER",
    content: "TEXT",
    createdAt: "INTEGER",
    updatedAt: "INTEGER",
    "FOREIGN KEY(reportId)": "REFERENCES reports(id)",
    "FOREIGN KEY(authorId)": "REFERENCES users(id)",
  },
};

async function setupSchema(db) {
  await db.query("PRAGMA foreign_keys = ON");

  for (const [tableName, structure] of Object.entries(tablesStructure)) {
    await db.createTable(tableName, structure);
  }
}

async function tableIsEmpty(db, tableName) {
  const rows = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
  return parseInt(rows.split("\n")[0]) === 0;
}

async function mockData(db) {
  if (await tableIsEmpty(db, "geoLocations")) {
    for (const location of dbData.geoLocations) {
      if (!location.city) {
        try {
          location.city = await getCityNameFromCoords(
            location.latitude,
            location.longitude,
          );
        } catch (error) {
          console.warn(
            `Failed to get city name for location ${location.id}:`,
            error,
          );
          location.city = "Unknown";
        }
      }
      await db.insertInto("geoLocations", location);
    }
  }

  const tablesToFill = Object.keys(tablesStructure);

  for (const table of tablesToFill) {
    if (await tableIsEmpty(db, table)) {
      for (const item of dbData[table]) {
        await db.insertInto(table, item);
      }
    }
  }
}

export { setupSchema, mockData, tableIsEmpty };
