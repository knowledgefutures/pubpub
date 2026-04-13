import nodemailer from 'nodemailer';

import { env } from 'server/env';

export const transporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	// secure: true uses implicit TLS (port 465). When false (port 587, the
	// default), nodemailer upgrades to TLS automatically via STARTTLS.
	secure: env.SMTP_PORT === 465,
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS,
	},
});

type From = { name: string; address: string };
type Body = { text: string } | { html: string };

type SendEmailOptions = {
	from?: From;
	replyTo?: string;
	to: string[];
	cc?: string[];
	bcc?: string[];
	subject: string;
} & Body;

const defaultFrom: From = {
	name: 'PubPub Team',
	address: 'hello@pubpub.org',
};

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
	const { from = defaultFrom, to, subject, replyTo, cc, bcc } = options;
	const body = 'text' in options ? { text: options.text } : { html: options.html };
	await transporter.sendMail({
		from: { name: from.name, address: from.address },
		to,
		subject,
		...body,
		...(replyTo && { replyTo }),
		...(cc && { cc }),
		...(bcc && { bcc }),
	});
};
