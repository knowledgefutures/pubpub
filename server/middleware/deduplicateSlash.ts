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
		const parsedUrl = parse(req.url);
		parsedUrl.pathname = expect(parsedUrl.pathname).replace(DUPLICATE_SLASH_PATTERN, '/');
		const correctedUrl = format(parsedUrl);
		// Since we search for duplicate slashes before parsing the URL there are some false
		// positives we should ignore, such as when the slashes are part of the query string
		if (correctedUrl === req.url) {
			return next();
		}
		res.redirect(301, correctedUrl);
	};
}
