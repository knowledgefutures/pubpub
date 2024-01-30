/** This should all be moved to an AWS lambda */

import { initServer } from '@ts-rest/express';
import express from 'express';

import { contract } from 'utils/api/contract';

const s = initServer();

const sendToStitch = async (payload: any) => {
	if (!process.env.STITCH_WEBHOOK_URL) {
		throw new Error('Missing STITCH_WEBHOOK_URL');
	}

	const response = await fetch(process.env.STITCH_WEBHOOK_URL, {
		method: 'POST',
		body: JSON.stringify(payload),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	return response;
};

export const analyticsServer = s.router(contract.analytics, {
	track: {
		middleware: [
			// needed to parse analytics events from the client sent with `navigator.sendBeacon`
			express.text(),
			(req, res, next) => {
				if (typeof req.body === 'string') {
					try {
						req.body = JSON.parse(req.body);
					} catch (err) {
						console.error(err);
						// do nothing
					}
				}
				next();
			},
		],
		handler: async ({ body: payload }) => {
			await sendToStitch({
				payload,
			});

			return {
				status: 204,
				body: undefined,
			};
		},
	},
});
