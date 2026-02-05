import express from 'express';
import { query } from '../db';
import { authenticateJWT, AuthRequest, authorizeRoles } from '../middleware/auth';

const router = express.Router();

// GET all events for the user's college (including public and private)
router.get('/', authenticateJWT, async (req: AuthRequest, res: any) => {
    try {
        const userId = req.user?.id;
        const collegeId = req.user?.college_id;
        if (!collegeId) {
            return res.status(403).json({ error: 'User is not assigned to a college' });
        }

        const result = await query(
            `SELECT id, title, type, visibility, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date, event_time, 
             created_by, (created_by = $1) as is_owner
             FROM events 
             WHERE (visibility = 'everyone' AND college_id = $2)
             OR (created_by = $1)
             ORDER BY event_date ASC, event_time ASC`,
            [userId, collegeId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Fetch Events Error:', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// POST a new event (TPOs and Students)
router.post('/', authenticateJWT, async (req: AuthRequest, res: any) => {
    const { title, type, date, time, visibility } = req.body;
    try {
        const collegeId = req.user?.college_id;
        const role = req.user?.role;
        if (!collegeId) {
            return res.status(403).json({ error: 'User is not assigned to a college' });
        }

        // Students can ONLY create private events
        let effectiveVisibility = visibility || 'private';
        if (role === 'student') {
            effectiveVisibility = 'private';
        }

        const result = await query(
            "INSERT INTO events (college_id, title, type, visibility, event_date, event_time, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, type, visibility, TO_CHAR(event_date, 'YYYY-MM-DD') as event_date, event_time, created_by, true as is_owner",
            [collegeId, title, type, effectiveVisibility, date, time, req.user?.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        console.error('Create Event Error:', err);
        res.status(500).json({ error: 'Failed to create event', details: err.message });
    }
});

// DELETE an event
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res: any) => {
    const { id } = req.params;
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        const collegeId = req.user?.college_id;
        
        // Check if event exists and get its metadata
        const eventRes = await query('SELECT created_by, visibility, college_id FROM events WHERE id = $1', [id]);
        if (eventRes.rows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = eventRes.rows[0];

        // Permission check:
        // 1. Owner can always delete
        // 2. TPO can delete public events in their college
        const isOwner = event.created_by === userId;
        const isTPOManagingPublic = role === 'tpo' && event.college_id === collegeId && event.visibility === 'everyone';

        if (!isOwner && !isTPOManagingPublic) {
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
