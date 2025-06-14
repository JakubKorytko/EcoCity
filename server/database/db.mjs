import SQLiteORM from "./SQLiteORM.mjs";
import { mockData, setupSchema } from "./helpers.mjs";

const db = new SQLiteORM();

(async () => {
  await setupSchema(db);
  await mockData(db);
})();

export default db;
