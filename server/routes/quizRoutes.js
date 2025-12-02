// server/routes/quizRoutes.js
const express = require("express");
const db = require("../db");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ---- Gemini setup ----
const client = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const geminiModel = client.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// ---- Helper: promise-based query ----
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/* =========================================
   ADMIN: LIST ALL QUIZZES
   GET /api/quizzes
   ========================================= */
router.get("/", async (req, res) => {
  const sql = `
    SELECT quiz_id, title, description
    FROM quiz
    ORDER BY quiz_id
  `;

  try {
    const rows = await query(sql);
    res.json(rows);
  } catch (err) {
    console.error("List quizzes error:", err);
    res.status(500).json({ error: "DB error listing quizzes" });
  }
});

/* =========================================
   GET QUIZ + QUESTIONS + OPTIONS
   GET /api/quizzes/:quizId
   ========================================= */
router.get("/:quizId", async (req, res) => {
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

  try {
    const rows = await query(sql, [quizId]);
    if (!rows.length) return res.status(404).json({ error: "Quiz not found" });

    const quiz = {
      quiz_id: rows[0].quiz_id,
      title: rows[0].quiz_title,
      description: rows[0].quiz_description,
      questions: [],
    };

    const questionMap = {};

    rows.forEach((r) => {
      if (!questionMap[r.question_id]) {
        questionMap[r.question_id] = {
          question_id: r.question_id,
          question_text: r.question_text,
          options: [],
        };
        quiz.questions.push(questionMap[r.question_id]);
      }
      questionMap[r.question_id].options.push({
        option_id: r.option_id,
        option_text: r.option_text,
      });
    });

    res.json(quiz);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

/* =========================================
   ADMIN: UPDATE QUESTION TEXT
   PUT /api/quizzes/questions/:questionId
   body: { question_text }
   ========================================= */
router.put("/questions/:questionId", async (req, res) => {
  const { questionId } = req.params;
  const { question_text } = req.body;

  if (!question_text) {
    return res.status(400).json({ error: "question_text is required" });
  }

  const sql = `
    UPDATE quizquestions
    SET question_text = ?
    WHERE question_id = ?
  `;

  try {
    const result = await query(sql, [question_text, questionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.json({ success: true, question_id: Number(questionId), question_text });
  } catch (err) {
    console.error("Update question error:", err);
    res.status(500).json({ error: "DB error updating question" });
  }
});

/* =========================================
   ADMIN: UPDATE OPTION TEXT
   PUT /api/quizzes/options/:optionId
   body: { option_text }
   ========================================= */
router.put("/options/:optionId", async (req, res) => {
  const { optionId } = req.params;
  const { option_text } = req.body;

  if (!option_text) {
    return res.status(400).json({ error: "option_text is required" });
  }

  const sql = `
    UPDATE questionoption
    SET option_text = ?
    WHERE option_id = ?
  `;

  try {
    const result = await query(sql, [option_text, optionId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Option not found" });
    }
    res.json({ success: true, option_id: Number(optionId), option_text });
  } catch (err) {
    console.error("Update option error:", err);
    res.status(500).json({ error: "DB error updating option" });
  }
});

/* =========================================
   ADMIN: DELETE QUESTION (+ options)
   DELETE /api/quizzes/questions/:questionId
   ========================================= */
router.delete("/questions/:questionId", async (req, res) => {
  const { questionId } = req.params;

  const deleteOptionsSql = `DELETE FROM questionoption WHERE question_id = ?`;
  const deleteQuestionSql = `DELETE FROM quizquestions WHERE question_id = ?`;

  try {
    await query(deleteOptionsSql, [questionId]);
    const result = await query(deleteQuestionSql, [questionId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json({ success: true, deleted_question_id: Number(questionId) });
  } catch (err) {
    console.error("Delete question error:", err);
    res.status(500).json({ error: "DB error deleting question" });
  }
});

/* =========================================
   ADMIN: ADD NEW QUESTION + OPTIONS
   POST /api/quizzes/:quizId/questions
   body: { question_text, options: [ "opt1", "opt2", ... ] }
   ========================================= */
router.post("/:quizId/questions", async (req, res) => {
  const { quizId } = req.params;
  const { question_text, options } = req.body;

  if (!question_text) {
    return res.status(400).json({ error: "question_text is required" });
  }
  if (!Array.isArray(options) || options.length < 2) {
    return res
      .status(400)
      .json({ error: "At least 2 options are required" });
  }

  try {
    // 1) insert question
    const insertQuestionSql = `
      INSERT INTO quizquestions (quiz_id, question_text)
      VALUES (?, ?)
    `;
    const qResult = await query(insertQuestionSql, [quizId, question_text]);
    const newQuestionId = qResult.insertId;

    // 2) insert options
    const insertedOptions = [];
    const insertOptionSql = `
      INSERT INTO questionoption (question_id, option_text)
      VALUES (?, ?)
    `;

    for (const optText of options) {
      const oResult = await query(insertOptionSql, [newQuestionId, optText]);
      insertedOptions.push({
        option_id: oResult.insertId,
        option_text: optText,
      });
    }

    // Return new question in same shape as GET /:quizId
    res.json({
      question_id: newQuestionId,
      question_text,
      options: insertedOptions,
    });
  } catch (err) {
    console.error("Add question error:", err);
    res.status(500).json({ error: "DB error adding question" });
  }
});

/* =========================================
   AI Evaluation Route
   POST /api/quizzes/:quizId/evaluate
   ========================================= */
router.post("/:quizId/evaluate", async (req, res) => {
  const quizId = req.params.quizId;
  const { user_id, answers } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: "Invalid answers" });
  }

  try {
    const qaPairs = [];

    for (const ans of answers) {
      const sql = `
        SELECT qq.question_text, qo.option_text
        FROM quizquestions qq
        JOIN questionoption qo ON qq.question_id = qo.question_id
        WHERE qq.quiz_id = ?
          AND qq.question_id = ?
          AND qo.option_id = ?
      `;

      const rows = await query(sql, [
        quizId,
        ans.question_id,
        ans.selected_option_id,
      ]);

      if (rows.length > 0) {
        qaPairs.push({
          question: rows[0].question_text,
          answer: rows[0].option_text,
        });
      }
    }

    if (qaPairs.length === 0) {
      return res.status(400).json({ error: "No valid answers found" });
    }

    const prompt = `
Analyze this quiz result and provide hobby recommendations:

${JSON.stringify(qaPairs, null, 2)}

Return ONLY valid JSON (no markdown, no extra text):

{
  "personality_type": "A personality type name",
  "personality_summary": "A 2-3 sentence summary of the personality",
  "strengths": ["strength1", "strength2", "strength3"],
  "suggested_hobbies": [
    {"hobby": "hobby name", "reason": "why this hobby fits them"}
  ],
  "generated_at": "$(new Date().toISOString())"
}
`;

    const response = await geminiModel.generateContent(prompt);
    let text = response.response.text().trim();

    // Remove ```json fences if Gemini returns markdown
    if (text.startsWith("```")) {
      text = text.replace(/```json|```/g, "").trim();
    }

    const aiJson = JSON.parse(text);

    res.json({
      success: true,
      ai_result: aiJson,
      source: "gemini",
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ error: "AI failed", details: err.message });
  }
});

/* =========================================
   Save AI Result to DB
   POST /api/quizzes/save-result
   ========================================= */
router.post("/save-result", async (req, res) => {
  const {
    user_id,
    personality_type,
    personality_summary,
    strengths,
    suggested_hobbies,
    reasons,
  } = req.body;

  const sql = `
    INSERT INTO user_ai_results (
      user_id, personality_type, personality_summary, strengths,
      suggested_hobbies, reasons, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  try {
    await query(sql, [
      user_id,
      personality_type,
      personality_summary,
      JSON.stringify(strengths),
      JSON.stringify(suggested_hobbies),
      JSON.stringify(reasons),
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error("Save AI result error:", err);
    res.status(500).json({ error: "DB insert failed" });
  }
});

module.exports = router;
