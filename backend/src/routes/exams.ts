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
                   (SELECT COUNT(*)::int FROM questions WHERE exam_id = e.id) as question_count,
                   EXISTS (SELECT 1 FROM attempts WHERE exam_id = e.id AND student_id = $1 AND submitted_at IS NOT NULL) as is_attempted,
                   (SELECT score FROM attempts WHERE exam_id = e.id AND student_id = $1 ORDER BY created_at DESC LIMIT 1) as score
            FROM exams e
            WHERE 1=1
        `;
        const params: any[] = [req.user?.id];

        if (req.user?.role !== 'admin') {
            const collegeId = req.user?.college_id || null;
            sql += ' AND e.college_id = $2';
            params.push(collegeId);
        }

        const result = await query(sql, params);
        
        // Debug log to help identify why no data is returned
        if (result.rows.length === 0) {
            console.log(`No exams found for user ${req.user?.id} in college ${req.user?.college_id}`);
        }

        res.json(result.rows);
    } catch (err: any) {
        console.error('Fetch Exams Error:', err);
        res.status(500).json({ error: 'Failed to fetch exams', details: err.message });
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
    const { title, duration, code } = req.body;
    try {
        const result = await query(
            'INSERT INTO exams (title, code, duration, college_id, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, code, duration, req.user?.college_id, req.user?.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Create Exam Error:', err);
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

        // Use separate parameterized inserts for each question to avoid formatting issues and SQL injection
        for (const q of questions) {
            await query(
                'INSERT INTO questions (exam_id, question, options, correct_answer) VALUES ($1, $2, $3, $4)',
                [examId, q.question, JSON.stringify(q.options), q.correct_answer]
            );
        }

        res.status(201).json({ message: 'Questions added' });
    } catch (err) {
        console.error('Add Questions Error:', err);
        res.status(500).json({ error: 'Failed to add questions' });
    }
});

// Submit exam attempt (Student only)
router.post('/:examId/attempt', authenticateJWT, authorizeRoles('student'), async (req: AuthRequest, res: any) => {
    const { examId } = req.params;
    const { answers, attempt_id, is_termination, termination_reason } = req.body; // Map of { questionId: answer }

    if (!attempt_id) {
        return res.status(400).json({ error: 'attempt_id required' });
    }

    try {
        // Fetch correct answers
        const questions = await query('SELECT id, correct_answer FROM questions WHERE exam_id = $1', [examId]);
        let score = 0;
        questions.rows.forEach((q: any) => {
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

        if (is_termination) {
            console.log(`[Integrity] Attempt ${attempt_id} terminated. Reason: ${termination_reason}`);
        }

        res.status(200).json(attempt.rows[0]);
    } catch (err) {
        console.error('Submission Error:', err);
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

// Delete an exam (TPO/Admin)
router.delete('/:examId', authenticateJWT, authorizeRoles('tpo', 'admin'), async (req: AuthRequest, res: any) => {
    const { examId } = req.params;
    try {
        // Verify exam belongs to college
        if (req.user?.role !== 'admin') {
            const check = await query('SELECT id FROM exams WHERE id = $1 AND college_id = $2', [examId, req.user?.college_id]);
            if (check.rows.length === 0) return res.status(403).json({ error: 'Unauthorized or Exam not found' });
        }

        // Deletion order to satisfy foreign key constraints:
        // 1. integrity_logs (referencing attempts)
        // 2. attempts (referencing exams)
        // 3. applications (referencing exams)
        // 4. questions (referencing exams) - though questions has ON DELETE CASCADE in init_db.sql, let's be explicit if needed, but it should be fine.
        // 5. exams

        await query('DELETE FROM integrity_logs WHERE attempt_id IN (SELECT id FROM attempts WHERE exam_id = $1)', [examId]);
        await query('DELETE FROM attempts WHERE exam_id = $1', [examId]);
        await query('DELETE FROM applications WHERE exam_id = $1', [examId]);
        // questions has ON DELETE CASCADE in schema, but we can be explicit
        await query('DELETE FROM questions WHERE exam_id = $1', [examId]);
        await query('DELETE FROM exams WHERE id = $1', [examId]);

        res.json({ message: 'Exam and related data deleted successfully' });
    } catch (err: any) {
        console.error('Delete Exam Error:', err);
        res.status(500).json({ error: 'Failed to delete exam', details: err.message });
    }
});

export default router;
