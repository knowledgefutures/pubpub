/* eslint-disable consistent-return */

import { parse, format } from 'url';
import { expect } from 'utils/assert';

const DUPLICATE_SLASH_PATTERN = /(\/+)\1/g;

export function deduplicateSlash() {
	return function deduplicateSlashMiddleware(req: Request, res, next) {
		const duplicateSlashMatches = req.url.match(DUPLICATE_SLASH_PATTERN);
		if (duplicateSlashMatches === null) {
			return next();
		}
		const correctedUrl = parse(req.url);
		correctedUrl.pathname = expect(correctedUrl.pathname).replace(DUPLICATE_SLASH_PATTERN, '/');
		res.redirect(301, format(correctedUrl));
	};
}
