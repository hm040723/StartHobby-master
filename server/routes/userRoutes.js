// server/routes/userRoutes.js
const express = require("express");
const db = require("../db");
const router = express.Router();

// GET /api/users/:userId/profile
router.get("/:userId/profile", (req, res) => {
  const sql = `
    SELECT 
      u.user_id, u.username, u.email, u.type_id,
      up.points, up.xp, up.current_streak_days, up.last_login_date,
      m.membership_id, m.color_name, m.min_xp
    FROM users u
    LEFT JOIN user_progress up ON u.user_id = up.user_id
    LEFT JOIN membership m ON up.membership_id = m.membership_id
    WHERE u.user_id = ?
  `;
  db.query(sql, [req.params.userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  });
});

// GET /api/users/:userId/badges
router.get("/:userId/badges", (req, res) => {
  const sql = `
    SELECT b.badge_id, b.name, b.description
    FROM userbadge ub
    JOIN badge b ON ub.badge_id = b.badge_id
    WHERE ub.user_id = ?
  `;
  db.query(sql, [req.params.userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(rows);
  });
});

module.exports = router;
