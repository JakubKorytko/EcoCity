import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const databasePath = path.join(import.meta.dirname, "database.sqlite");

class SQLiteORM {
  constructor(dbPath = databasePath) {
    this.dbPath = dbPath;
    this.running = false;
    this.queue = [];
    this.buffer = "";

    if (!fs.existsSync(this.dbPath)) {
      fs.closeSync(fs.openSync(this.dbPath, "w"));
    }

    this.process = spawn("sqlite3", [this.dbPath], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    this.process.stdout.on("data", (data) => {
      this.buffer += data.toString();
      let endIndex;
      while ((endIndex = this.buffer.indexOf("--END--")) !== -1) {
        const output = this.buffer.slice(0, endIndex).trim();
        this.buffer = this.buffer.slice(endIndex + "--END--".length);
        if (this.queue.length) {
          const { resolve } = this.queue.shift();
          resolve(output);
        }
      }
    });

    this.process.on("exit", () => {
      this.running = false;
    });

    this.running = true;
  }

  query(sql) {
    return new Promise((resolve, reject) => {
      if (!this.running) return reject(new Error("Process not running."));
      this.queue.push({ resolve, reject });
      this.process.stdin.write(".mode list\n");
      this.process.stdin.write(".separator |\n");
      this.process.stdin.write(sql.trim() + ";\n");
      this.process.stdin.write(".print --END--\n");
    });
  }

  async createTable(tableName, columns) {
    const cols = Object.entries(columns)
      .map(([name, type]) => `${name} ${type}`)
      .join(", ");
    await this.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${cols})`);
  }

  async insertInto(tableName, row) {
    const keys = Object.keys(row);
    const values = keys
      .map((k) => {
        const value = row[k];
        if (value === null || value === undefined) return "NULL";
        if (typeof value === "number") return value;
        return `'${String(value).replace(/'/g, "''")}'`;
      })
      .join(", ");
    const columns = keys.join(", ");
    await this.query(
      `INSERT INTO ${tableName} (${columns}) VALUES (${values})`,
    );
  }

  async selectAll(tableName) {
    const result = await this.query(`SELECT * FROM ${tableName}`);
    return this.parseResultWithColumns(result, tableName);
  }

  async selectWhere(tableName, conditions) {
    const whereClause = Object.entries(conditions)
      .map(([k, v]) => `${k} = '${String(v).replace(/'/g, "''")}'`)
      .join(" AND ");
    const result = await this.query(
      `SELECT * FROM ${tableName} WHERE ${whereClause}`,
    );
    return this.parseResultWithColumns(result, tableName);
  }

  async getTableColumns(tableName) {
    const result = await this.query(`PRAGMA table_info(${tableName})`);
    return result
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.split("|")[1]); // Extract column names
  }

  async parseResultWithColumns(raw, tableName) {
    const columns = await this.getTableColumns(tableName);
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => {
        const values = line.split("|");
        return columns.reduce((obj, col, index) => {
          obj[col] = values[index];
          return obj;
        }, {});
      });
  }

  async tableExists(tableName) {
    const result = await this.query(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
    );
    return result.includes(tableName);
  }

  async isEmpty(tableName) {
    const result = await this.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.split("\n")[0]) === 0;
  }

  parseResult(raw) {
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.split("|"));
  }

  status() {
    return this.running ? "running" : "stopped";
  }

  close() {
    return new Promise((resolve) => {
      if (!this.running) return resolve();
      this.process.stdin.end();
      this.process.on("close", () => {
        this.running = false;
        resolve();
      });
    });
  }
}

export default SQLiteORM;
