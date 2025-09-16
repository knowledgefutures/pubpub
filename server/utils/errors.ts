import * as Sentry from '@sentry/node';
import type { NextFunction, Request, Response } from 'express';
import { resolve } from 'path';
import type { ForbiddenSlugStatus } from 'types';
import { isRequestAborted } from '../abort';

export enum PubPubApplicationError {
	ForbiddenSlug = 'forbidden-slug',
	CommunityIsSpam = 'community-is-spam',
}

class PubPubBaseError extends Error {
	readonly type: PubPubApplicationError;

	constructor(type: PubPubApplicationError, message: string) {
		super(message);
		this.type = type;
	}
}

export const PubPubError = {
	ForbiddenSlugError: class extends PubPubBaseError {
		readonly desiredSlug: string;
		readonly slugStatus: ForbiddenSlugStatus;

		constructor(desiredSlug: string, slugStatus: ForbiddenSlugStatus) {
			super(PubPubApplicationError.ForbiddenSlug, 'Forbidden slug');
			this.desiredSlug = desiredSlug;
			this.slugStatus = slugStatus;
		}
	},
	CommunityIsSpamError: class extends PubPubBaseError {
		constructor() {
			super(PubPubApplicationError.CommunityIsSpam, 'Community is spam');
		}
	},
};

export class HTTPStatusError extends Error {
	readonly status: number;

	constructor(status, sourceError?: Error) {
		super(`HTTP Error ${status}${sourceError ? ': ' + sourceError.message : ''}`);
		this.status = status;
	}

	inRange(codeRange) {
		return this.status >= codeRange && this.status <= codeRange + 99;
	}
}

export class BadRequestError extends HTTPStatusError {
	constructor(sourceError?: Error) {
		super(400, sourceError);
	}
}

export class ForbiddenError extends HTTPStatusError {
	constructor(sourceError?: Error) {
		super(403, sourceError);
	}
}

export class NotFoundError extends HTTPStatusError {
	constructor(sourceError?: Error) {
		super(404, sourceError);
	}
}

export class RequestAbortedError extends Error {
	readonly name: string = 'RequestAbortedError';
	constructor(details?: string) {
		super('Request aborted' + (details ? `: ${details}` : ''));
	}
}
export class DatabaseRequestAbortedError extends RequestAbortedError {
	readonly name: string = 'DatabaseRequestAbortedError';
	constructor() {
		super('Database request aborted');
	}
}

export const handleErrors = (req: Request, res: Response, next: NextFunction) => {
	return (err) => {
		if (isRequestAborted() || err.name.includes('DatabaseRequestAbortedError')) {
			return res.status(408).json({ error: 'Request aborted' });
		}

		if (
			err.message === 'Community Not Found' ||
			err instanceof PubPubError.CommunityIsSpamError
		) {
			return res
				.status(404)
				.sendFile(resolve(__dirname, '../errorPages/communityNotFound.html'));
		}

		if (err.message.indexOf('UseCustomDomain:') === 0) {
			const customDomain = err.message.split(':')[1];
			return res.redirect(`https://${customDomain}${req.originalUrl}`);
		}

		if (err instanceof HTTPStatusError) {
			if (err.inRange(400)) {
				return next();
			}
		}

		if (
			err.message === 'Page Not Found' ||
			err.message === 'Pub Not Found' ||
			err.message === 'Review Not Found' ||
			err.message === 'User Not Admin' ||
			err.message === 'User Not Found'
		) {
			return next();
		}
		console.error('Err', err);
		if (process.env.NODE_ENV === 'production') {
			Sentry.configureScope((scope) => {
				scope.setTag('error_source', 'server_error_handler');
			});
			Sentry.captureException(err);
		}
		return res.status(500).sendFile(resolve(__dirname, '../errorPages/error.html'));
	};
};

export const errorMiddleware = (err: Error, _, res: Response, next: NextFunction) => {
	if (err instanceof PubPubError.ForbiddenSlugError) {
		res.status(400).json({
			type: err.type,
			slugStatus: err.slugStatus,
			desiredSlug: err.desiredSlug,
		});
	} else if (err instanceof RequestAbortedError) {
		console.log('[REQUEST DESTROYED]: ENDING RESPONSE, DESTROYING CONNECTION', err);
		res.end();
		res.destroy();
	} else if (err instanceof HTTPStatusError) {
		if (!res.headersSent) {
			res.status(err.status).send(err.message);
		}
	} else if (!res.headersSent) {
		res.status(500);
		next(err);
	}
};
