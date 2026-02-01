import express from 'express';
import { query } from '../db';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// GET all events for the user's college
router.get('/', authenticateJWT, async (req: AuthRequest, res: any) => {
    try {
        const collegeId = req.user?.college_id;
        if (!collegeId) {
            return res.status(403).json({ error: 'User is not assigned to a college' });
        }

        const result = await query(
            "SELECT id, title, type, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date, event_time FROM events WHERE college_id = $1 ORDER BY event_date ASC, event_time ASC",
            [collegeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch Events Error:', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// POST a new event (TPO only)
router.post('/', authenticateJWT, authorizeRoles('tpo'), async (req: AuthRequest, res: any) => {
    const { title, type, date, time } = req.body;
    try {
        const collegeId = req.user?.college_id;
        if (!collegeId) {
            return res.status(403).json({ error: 'User is not assigned to a college' });
        }

        const result = await query(
            "INSERT INTO events (college_id, title, type, event_date, event_time, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, title, type, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date, event_time",
            [collegeId, title, type, date, time, req.user?.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error('Create Event Error:', err);
        res.status(500).json({ error: 'Failed to create event', details: err.message });
    }
});

// DELETE an event (TPO only)
router.delete('/:id', authenticateJWT, authorizeRoles('tpo'), async (req: AuthRequest, res: any) => {
    const { id } = req.params;
    try {
        const collegeId = req.user?.college_id;
        
        // Ensure event belongs to the same college
        const eventCheck = await query('SELECT college_id FROM events WHERE id = $1', [id]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (eventCheck.rows[0].college_id !== collegeId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await query('DELETE FROM events WHERE id = $1', [id]);
        res.json({ message: 'Event deleted' });
    } catch (err) {
        console.error('Delete Event Error:', err);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

export default router;
