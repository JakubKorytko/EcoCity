CREATE TABLE roles (name TEXT PRIMARY KEY, description TEXT, permissions TEXT);
CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user', FOREIGN KEY(role) REFERENCES roles(name));
CREATE TABLE userDetails (id INTEGER PRIMARY KEY, name TEXT, avatar TEXT, FOREIGN KEY(id) REFERENCES users(id));
CREATE TABLE geoLocations (id INTEGER PRIMARY KEY, latitude REAL, longitude REAL, city TEXT);
CREATE TABLE reports (id INTEGER PRIMARY KEY, title TEXT, description TEXT, status TEXT, createdAt INTEGER, updatedAt INTEGER, authorId INTEGER, geoLocationId INTEGER, image TEXT, FOREIGN KEY(authorId) REFERENCES users(id), FOREIGN KEY(geoLocationId) REFERENCES geoLocations(id));
CREATE TABLE activeSessions (token TEXT PRIMARY KEY, userId INTEGER, email TEXT, createdAt INTEGER, FOREIGN KEY(userId) REFERENCES users(id));
CREATE TABLE comments (id INTEGER PRIMARY KEY, reportId INTEGER, authorId INTEGER, content TEXT, createdAt INTEGER, updatedAt INTEGER, FOREIGN KEY(reportId) REFERENCES reports(id), FOREIGN KEY(authorId) REFERENCES users(id));
