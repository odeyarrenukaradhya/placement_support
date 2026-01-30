import express from 'express';
import { query } from '../db';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';
import { collegeIsolation } from '../middleware/isolation';

const router = express.Router();

// Get all exams for the user's college
router.get('/', authenticateJWT, collegeIsolation, async (req: AuthRequest, res: any) => {
    try {
        let sql = `
            SELECT e.*, 
                   (CASE WHEN a.submitted_at IS NOT NULL THEN true ELSE false END) as is_attempted,
                   a.score
            FROM exams e
            LEFT JOIN LATERAL (
                SELECT submitted_at, score 
                FROM attempts 
                WHERE exam_id = e.id AND student_id = $1 
                ORDER BY created_at DESC 
                LIMIT 1
            ) a ON true
            WHERE 1=1
        `;
        const params: any[] = [req.user?.id];

        if (req.user?.role !== 'admin') {
            sql += ' AND e.college_id = $2';
            params.push(req.user?.college_id);
        }

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
});

// Get questions for an exam
router.get('/:examId/questions', authenticateJWT, collegeIsolation, async (req: AuthRequest, res: any) => {
    const { examId } = req.params;
    try {
        // Verify exam belongs to user's college
        if (req.user?.role !== 'admin') {
            const check = await query('SELECT id FROM exams WHERE id = $1 AND college_id = $2', [examId, req.user?.college_id]);
            if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });
        }

        const result = await query('SELECT id, question, options FROM questions WHERE exam_id = $1', [examId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Create an exam (TPO only)
router.post('/', authenticateJWT, authorizeRoles('tpo'), async (req: AuthRequest, res: any) => {
    const { title, duration } = req.body;
    try {
        const result = await query(
            'INSERT INTO exams (title, duration, college_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, duration, req.user?.college_id, req.user?.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create exam' });
    }
});

// Add questions to exam (TPO only)
router.post('/:examId/questions', authenticateJWT, authorizeRoles('tpo'), async (req: AuthRequest, res: any) => {
    const { examId } = req.params;
    const { questions } = req.body; // Array of { question, options, correct_answer }

    try {
        // Verify exam belongs to the TPO's college
        const examCheck = await query('SELECT id FROM exams WHERE id = $1 AND college_id = $2', [examId, req.user?.college_id]);
        if (examCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Unauthorized or Exam not found' });
        }

        const values = questions.map((q: any) => `('${examId}', '${q.question}', '${JSON.stringify(q.options)}', '${q.correct_answer}')`).join(',');
        await query(`INSERT INTO questions (exam_id, question, options, correct_answer) VALUES ${values}`);

        res.status(201).json({ message: 'Questions added' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add questions' });
    }
});

// Submit exam attempt (Student only)
router.post('/:examId/attempt', authenticateJWT, authorizeRoles('student'), async (req: AuthRequest, res: any) => {
    const { examId } = req.params;
    const { answers, attempt_id } = req.body; // Map of { questionId: answer }

    if (!attempt_id) {
        return res.status(400).json({ error: 'attempt_id required' });
    }

    try {
        // Fetch correct answers
        const questions = await query('SELECT id, correct_answer FROM questions WHERE exam_id = $1', [examId]);
        let score = 0;
        questions.rows.forEach(q => {
            if (answers[q.id] === q.correct_answer) {
                score++;
            }
        });

        // Update existing attempt
        const attempt = await query(
            'UPDATE attempts SET score = $1, submitted_at = NOW() WHERE id = $2 AND student_id = $3 AND submitted_at IS NULL RETURNING *',
            [score, attempt_id, req.user?.id]
        );

        if (attempt.rows.length === 0) {
            return res.status(400).json({ error: 'Attempt already submitted or invalid' });
        }

        res.status(200).json(attempt.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit attempt' });
    }
});

// Get Exam Integrity Logs (TPO/Admin)
router.get('/:examId/integrity', authenticateJWT, authorizeRoles('tpo', 'admin'), async (req: AuthRequest, res: any) => {
    const { examId } = req.params;
    try {
        // Verify exam belongs to college
        if (req.user?.role !== 'admin') {
             const check = await query('SELECT id FROM exams WHERE id = $1 AND college_id = $2', [examId, req.user?.college_id]);
             if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });
        }

        const logs = await query(
            `SELECT il.*, a.student_id, u.name as student_name, u.email as student_email 
             FROM integrity_logs il
             JOIN attempts a ON il.attempt_id = a.id
             JOIN users u ON a.student_id = u.id
             WHERE a.exam_id = $1
             ORDER BY il.created_at DESC`,
            [examId]
        );
        res.json(logs.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch integrity logs' });
    }
});

export default router;
