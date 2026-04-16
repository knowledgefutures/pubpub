import { Router } from 'express';

export const router = Router();

// Redirect legacy /admin to the superadmin analytics tab
router.get('/admin', (_, res) => {
	return res.redirect(301, '/superadmin/analytics');
});
