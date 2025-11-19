// server/routes/quizRoutes.js
const express = require("express");
const db = require("../db");
const router = express.Router();

// GET /api/quizzes  → list all quizzes
router.get("/", (req, res) => {
  db.query("SELECT quiz_id, title, description FROM quiz", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }
    res.json(rows);
  });
});

// GET /api/quizzes/:quizId  → quiz + questions + options
router.get("/:quizId", (req, res) => {
  const quizId = req.params.quizId;

  const sql = `
    SELECT 
      q.quiz_id, q.title AS quiz_title, q.description AS quiz_description,
      qq.question_id, qq.question_text,
      qo.option_id, qo.option_text
    FROM quiz q
    JOIN quizquestions qq ON q.quiz_id = qq.quiz_id
    JOIN questionoption qo ON qq.question_id = qo.question_id
    WHERE q.quiz_id = ?
    ORDER BY qq.question_id, qo.option_id
  `;

  db.query(sql, [quizId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Convert flat rows → nested structure
    const quiz = {
      quiz_id: rows[0].quiz_id,
      title: rows[0].quiz_title,
      description: rows[0].quiz_description,
      questions: []
    };

    const questionMap = {};

    rows.forEach(r => {
      if (!questionMap[r.question_id]) {
        questionMap[r.question_id] = {
          question_id: r.question_id,
          question_text: r.question_text,
          options: []
        };
        quiz.questions.push(questionMap[r.question_id]);
      }
      questionMap[r.question_id].options.push({
        option_id: r.option_id,
        option_text: r.option_text
      });
    });

    res.json(quiz);
  });
});

module.exports = router;
