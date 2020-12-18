import { resolve } from 'path';
import * as Sentry from '@sentry/node';

export enum PubPubApplicationError {
	InvalidFields = 'InvalidFields',
}

class PubPubBaseError extends Error {
	readonly type: PubPubApplicationError;

	constructor(type: PubPubApplicationError, message: string) {
		super(message);
		this.type = type;
	}
}

export const PubPubError = {
	InvalidFieldsError: class extends PubPubBaseError {
		readonly fields: { [key: string]: any };

		constructor(...fields: string[]) {
			super(PubPubApplicationError.InvalidFields, 'Invalid fields');
			this.fields = fields.reduce((acc, str) => ({ ...acc, [str]: true }), {});
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

export const handleErrors = (req, res, next) => {
	return (err) => {
		if (err.message === 'Community Not Found') {
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

export const errorMiddleware = (err, _, res, next) => {
	if (err instanceof PubPubError.InvalidFieldsError) {
		res.status(400).json({ type: err.type, fields: err.fields });
	} else if (err instanceof HTTPStatusError) {
		if (!res.headersSent) {
			res.status(err.status).send(err.message);
		}
	} else if (!res.headersSent) {
		res.status(500);
		next(err);
	}
};
