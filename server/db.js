// server/db.js
const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",        // your MySQL user
  password: "root",    // your MySQL password
  database: "starthobby" // your DB name
});

db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
    conn.release();
  }
});

module.exports = db;
