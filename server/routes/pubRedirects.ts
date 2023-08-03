import queryString, { ParsedQuery } from 'query-string';

import { isDuqDuq } from 'utils/environment';
import app from 'server/server';
import { Community, Pub, Release } from 'server/models';
import { handleErrors } from 'server/utils/errors';
import { hostIsValid } from 'server/utils/routes';

const getParams = (req) => {
	const hostname = isDuqDuq()
		? `https://${req.hostname.replace('pubpub.org', 'duqduq.org')}`
		: `https://${req.hostname}`;
	return {
		slug: req.params.slug.toLowerCase(),
		versionNumber: req.params.versionNumber,
		manageMode: req.params.manageMode,
		domain: req.headers.localhost ? `http://${req.headers.localhost}` : hostname,
	};
};

/* Redirect /pub/slug paths on www.pubpub.org */
app.get('/pub/:slug', async (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}
	try {
		const pubData = await Pub.findOne({
			/* The replace statement is to capture v3 pub slug conventions */
			where: { slug: req.params.slug.replace(/_/gi, '-').toLowerCase() },
			attributes: ['id'],
			include: [{ model: Community, as: 'community', attributes: ['subdomain', 'domain'] }],
		});
		if (pubData) {
			const newDomain = pubData.community.domain
				? pubData.community.domain
				: `${pubData.community.subdomain}.pubpub.org`;
			return res.redirect(`https://${newDomain}/pub/${req.params.slug.replace(/_/gi, '-')}`);
		}
		return res.redirect(`https://v3.pubpub.org/pub/${req.params.slug}`);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

/* Redirect /pub/slug paths on communities to appropriate release or draft */
app.get('/pub/:slug', async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const { slug, domain } = getParams(req);
		const prefix = `${domain}/pub/${slug}`;
		const pubData = await Pub.findOne({
			where: { slug },
			attributes: ['id'],
			include: [{ model: Release, as: 'releases' }],
		});
		if (!pubData) {
			throw new Error('Pub Not Found');
		}

		const baseUrl =
			pubData.releases && pubData.releases.length
				? `${prefix}/release/${pubData.releases.length}`
				: `${prefix}/draft`;

		const redirectUrl = queryString.stringifyUrl({
			url: baseUrl,
			query: req.query as ParsedQuery,
		});
		return res.redirect(redirectUrl);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

/* Redirect legacy /pub/slug/branch routes */
app.get(
	['/pub/:slug/branch/:branchShortId', '/pub/:slug/branch/:branchShortId/:versionNumber'],
	async (req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}
		try {
			const { slug, domain, versionNumber } = getParams(req);
			const prefix = `${domain}/pub/${slug}`;
			const pubData = await Pub.findOne({
				where: { slug },
				attributes: ['id', 'slug', 'viewHash', 'editHash'],
			});

			if (!pubData) {
				throw new Error('Pub Not Found');
			}

			const baseUrl = versionNumber
				? `${prefix}/release/${parseInt(versionNumber, 10)}`
				: prefix;

			const redirectUrl = queryString.stringifyUrl({
				url: baseUrl,
				query: req.query as ParsedQuery,
			});
			return res.redirect(redirectUrl);
		} catch (err) {
			return handleErrors(req, res, next)(err);
		}
	},
);

/* Redirect /pub/slug/manage  */
app.get(['/pub/:slug/manage/', '/pub/:slug/manage/:manageMode'], async (req, res, next) => {
	if (!hostIsValid(req, 'community')) {
		return next();
	}
	try {
		const { slug, domain, manageMode } = getParams(req);
		const modeString = manageMode ? `/${manageMode}` : '';
		return res.redirect(`${domain}/dash/pub/${slug}/settings${modeString}`);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
