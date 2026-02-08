import express from 'express';
import { query } from '../db';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// Student: Get their own attempts and scores
router.get('/student/my-scores', authenticateJWT, authorizeRoles('student'), async (req: AuthRequest, res: any) => {
    try {
        const result = await query(`
            SELECT 
                a.*, 
                e.title as exam_title, 
                e.duration,
                COALESCE((SELECT COUNT(*) FROM questions q WHERE q.exam_id = e.id), 0) as total_questions
            FROM attempts a
            JOIN exams e ON a.exam_id = e.id
            WHERE a.student_id = $1 AND a.submitted_at IS NOT NULL
            ORDER BY a.submitted_at ASC
        `, [req.user?.id]);
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch Scores Error:', err);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// Student: Get Dashboard Stats
router.get('/student/dashboard-stats', authenticateJWT, authorizeRoles('student'), async (req: AuthRequest, res: any) => {
    try {
        const studentId = req.user?.id;
        const collegeId = req.user?.college_id;

        // 1. Completed Attempts
        const completed = await query(
            'SELECT COUNT(*) FROM attempts WHERE student_id = $1 AND submitted_at IS NOT NULL',
            [studentId]
        );
        const completedCount = parseInt(completed.rows[0].count);

        // 2. Upcoming Exams (Available exams - Completed exams)
        // We assume all exams in the college are "upcoming" unless completed.
        // If an attempt exists but is NOT submitted (e.g. paused), it's still technically "upcoming" (can be resumed).
        // Only fully submitted exams are removed from "upcoming".
        const upcoming = await query(`
            SELECT COUNT(*) 
            FROM exams e
            WHERE e.college_id = $1 
            AND NOT EXISTS (
                SELECT 1 FROM attempts a 
                WHERE a.exam_id = e.id 
                AND a.student_id = $2 
                AND a.submitted_at IS NOT NULL
            )
        `, [collegeId, studentId]);
        const upcomingCount = parseInt(upcoming.rows[0].count);

        res.json({
            upcoming_exams: upcomingCount,
            completed_attempts: completedCount
        });
    } catch (err) {
        console.error('Student Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Student: Get Global Rankings (within college)
router.get('/student/rankings', authenticateJWT, authorizeRoles('student'), async (req: AuthRequest, res: any) => {
    try {
        const collegeId = req.user?.college_id;

        // Fetch all students in the college with their total scores
        const result = await query(`
            SELECT 
                u.id as student_id,
                u.name,
                COALESCE(SUM(a.score), 0) as total_score,
                COUNT(a.id) as exams_taken
            FROM users u
            LEFT JOIN attempts a ON u.id = a.student_id AND a.submitted_at IS NOT NULL
            WHERE u.role = 'student' AND u.college_id = $1
            GROUP BY u.id, u.name
            ORDER BY total_score DESC, u.name ASC
        `, [collegeId]);

        // Add rank to each student
        const rankings = result.rows.map((student: any, index: number) => ({
            rank: index + 1,
            ...student
        }));

        res.json(rankings);
    } catch (err) {
        console.error('Rankings Error:', err);
        res.status(500).json({ error: 'Failed to fetch rankings' });
    }
});

// TPO: Get participation stats for an exam
router.get('/tpo/exam-stats/:examId', authenticateJWT, authorizeRoles('tpo'), async (req: AuthRequest, res: any) => {
    const { examId } = req.params;
    try {
        // Verify exam belongs to TPO's college
        const examCheck = await query('SELECT id, title FROM exams WHERE id = $1 AND college_id = $2', [examId, req.user?.college_id]);
        if (examCheck.rows.length === 0) return res.status(403).json({ error: 'Unauthorized' });

        const attempts = await query(`
            SELECT * FROM (
                SELECT DISTINCT ON (a.student_id) 
                    a.id, a.exam_id, a.student_id, a.score, a.submitted_at, a.created_at,
                    u.name as student_name, u.email as student_email, u.usn, u.year,
                    COALESCE((
                        SELECT string_agg(type || ' - ' || count, ', ')
                        FROM (
                            SELECT type, count(*) 
                            FROM integrity_logs 
                            WHERE attempt_id = a.id 
                            GROUP BY type
                        ) AS counts
                    ), 'None') as integrity_summary
                FROM attempts a
                JOIN users u ON a.student_id = u.id
                WHERE a.exam_id = $1
                ORDER BY a.student_id, a.score DESC, a.submitted_at DESC
            ) sub
            ORDER BY score DESC
        `, [examId]);

        res.json({
            exam_id: examId,
            exam_title: examCheck.rows[0].title,
            total_attempts: attempts.rows.length,
            results: attempts.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch exam stats' });
    }
});

// TPO: Get Dashboard Stats (College Name, Counts)
router.get('/tpo/dashboard-stats', authenticateJWT, authorizeRoles('tpo'), async (req: AuthRequest, res: any) => {
    try {
        const collegeId = req.user?.college_id || null;

        // 1. College Name
        const college = await query('SELECT name FROM colleges WHERE id = $1', [collegeId]);
        const collegeName = college.rows[0]?.name || 'Unknown College';

        // 2. Exam Count
        const exams = await query('SELECT COUNT(*) FROM exams WHERE college_id = $1', [collegeId]);
        const examCount = parseInt(exams.rows[0].count);

        // 3. Student Count
        const students = await query('SELECT COUNT(*) FROM users WHERE college_id = $1 AND role = $2', [collegeId, 'student']);
        const studentCount = parseInt(students.rows[0].count);

        // 4. Participation Rate (Total Attempts / (Exams * Students))
        const totalAttemptsResult = await query(`
            SELECT COUNT(*) 
            FROM attempts a
            JOIN exams e ON a.exam_id = e.id
            WHERE e.college_id = $1
        `, [collegeId]);
        const attemptCount = parseInt(totalAttemptsResult.rows[0].count);

        const possibleAttempts = examCount * studentCount;
        const participationRate = possibleAttempts > 0
            ? Math.round((attemptCount / possibleAttempts) * 100)
            : 0;

        // 5. Total Attempts (Submitted)
        const submittedAttempts = await query(`
            SELECT COUNT(*) 
            FROM attempts a
            JOIN exams e ON a.exam_id = e.id
            WHERE e.college_id = $1 AND a.submitted_at IS NOT NULL
        `, [collegeId]);
        const submittedCount = parseInt(submittedAttempts.rows[0].count);

        // 6. Average Score (Percentage across all submitted attempts)
        const avgScoreResult = await query(`
            SELECT 
                AVG(
                    CASE 
                        WHEN (SELECT COUNT(*) FROM questions q WHERE q.exam_id = a.exam_id) > 0 
                        THEN (CAST(a.score AS FLOAT) / (SELECT COUNT(*) FROM questions q WHERE q.exam_id = a.exam_id)) * 100 
                        ELSE 0 
                    END
                ) as avg_score
            FROM attempts a
            JOIN exams e ON a.exam_id = e.id
            WHERE e.college_id = $1 AND a.submitted_at IS NOT NULL
        `, [collegeId]);
        const averageScore = Math.round(parseFloat(avgScoreResult.rows[0].avg_score || '0'));

        // 7. Performance Distribution
        const performanceResult = await query(`
            WITH student_scores AS (
                SELECT 
                    a.student_id,
                    AVG(
                        CASE 
                            WHEN (SELECT COUNT(*) FROM questions q WHERE q.exam_id = a.exam_id) > 0 
                            THEN (CAST(a.score AS FLOAT) / (SELECT COUNT(*) FROM questions q WHERE q.exam_id = a.exam_id)) * 100 
                            ELSE 0 
                        END
                    ) as avg_student_score
                FROM attempts a
                JOIN exams e ON a.exam_id = e.id
                WHERE e.college_id = $1 AND a.submitted_at IS NOT NULL
                GROUP BY a.student_id
            )
            SELECT 
                COUNT(*) FILTER (WHERE avg_student_score >= 80) as high,
                COUNT(*) FILTER (WHERE avg_student_score >= 50 AND avg_student_score < 80) as average,
                COUNT(*) FILTER (WHERE avg_student_score < 50) as low
            FROM student_scores
        `, [collegeId]);

        const distribution = performanceResult.rows[0];

        res.json({
            college_name: collegeName,
            exam_count: examCount,
            student_count: studentCount,
            participation_rate: participationRate,
            total_attempts: submittedCount,
            average_score: averageScore,
            performance_distribution: {
                high: parseInt(distribution.high || '0'),
                average: parseInt(distribution.average || '0'),
                low: parseInt(distribution.low || '0')
            }
        });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// TPO: Get All Students with Violation Counts
router.get('/tpo/students', authenticateJWT, authorizeRoles('tpo'), async (req: AuthRequest, res: any) => {
    try {
        const users = await query(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.created_at, 
                u.last_login_at,
                (
                    SELECT COUNT(*) 
                    FROM integrity_logs il 
                    JOIN attempts a ON il.attempt_id = a.id 
                    WHERE a.student_id = u.id
                ) as violations_count,
                (
                    SELECT json_build_object(
                        'tab_switches', COUNT(*) FILTER (WHERE il.type = 'tab_switch'),
                        'window_blur', COUNT(*) FILTER (WHERE il.type = 'window_blur'),
                        'fast_answering', COUNT(*) FILTER (WHERE il.type = 'fast_answering')
                    )
                    FROM integrity_logs il
                    JOIN attempts a ON il.attempt_id = a.id
                    WHERE a.student_id = u.id
                ) as violation_details
            FROM users u
            WHERE u.college_id = $1 AND u.role = 'student'
            ORDER BY u.name ASC
        `, [req.user?.college_id]);

        // Map the database snake_case keys for details to what frontend expects if needed,
        // though frontend uses matching keys currently.
        const mappedUsers = users.rows.map((u: any) => ({
            ...u,
            violations: parseInt(u.violations_count),
            violationDetails: u.violation_details
        }));

        res.json(mappedUsers);
    } catch (err) {
        console.error('Fetch Students Error:', err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// TPO: Get Recent Violations (Global Feed)
router.get('/tpo/recent-violations', authenticateJWT, authorizeRoles('tpo'), async (req: AuthRequest, res: any) => {
    try {
        const collegeId = req.user?.college_id || null;
        
        // Joined version that specifically only gets violations for this TPO's college
        const result = await query(`
            SELECT 
                a.id,
                u.name as "studentName",
                json_agg(json_build_object('type', il.type, 'timestamp', il.created_at)) as violations,
                MAX(il.created_at) as latest_violation
            FROM integrity_logs il
            INNER JOIN attempts a ON il.attempt_id = a.id
            INNER JOIN users u ON a.student_id = u.id
            WHERE u.college_id = $1
            GROUP BY a.id, u.name
            ORDER BY 4 DESC
            LIMIT 10
        `, [collegeId]);

        res.json(result.rows);
    } catch (err: any) {
        console.error('Recent Violations Error:', err);
        res.status(500).json({ error: 'Failed to fetch recent violations', details: err.message });
    }
});

export default router;
