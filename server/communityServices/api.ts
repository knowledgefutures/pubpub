import app, { wrap } from 'server/server';
import { sendServicesInquiryEmail } from 'server/utils/email/communityServices';

app.post(
	'/api/communityServices',
	wrap(async (req, res) => {
		sendServicesInquiryEmail(req.body);
		return res.status(201).json({ ok: true });
	}),
);
