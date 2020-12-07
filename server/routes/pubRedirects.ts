import queryString from 'query-string';

import { isDuqDuq } from 'utils/environment';
import app from 'server/server';
import { Community, Pub, Release, Branch } from 'server/models';
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
			where: { slug: slug },
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

		const redirectUrl = queryString.stringifyUrl({ url: baseUrl, query: req.query });
		return res.redirect(redirectUrl);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});

/* Redirect /pub/slug/branch routes */
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
				where: { slug: slug },
				attributes: ['id', 'slug', 'viewHash', 'editHash'],
				include: [
					{ model: Branch, as: 'branches' },
					{ model: Release, as: 'releases' },
				],
			});
			if (!pubData) {
				throw new Error('Pub Not Found');
			}
			const activeBranch = pubData.branches.find((br) => {
				return String(br.shortId) === req.params.branchShortId;
			});

			if (!activeBranch) {
				throw new Error('Pub Not Found');
			}

			const accessHash = req.query.access;
			let accessHashString = '';
			if (accessHash === activeBranch.viewHash || accessHash === activeBranch.discussHash) {
				accessHashString = `?access=${pubData.viewHash}`;
			}
			if (accessHash === activeBranch.editHash) {
				accessHashString = `?access=${pubData.editHash}`;
			}
			/* The + 1 in the two redirects below is because /branch/2/key routes */
			/* were 0-indexed to align the the keyable index. historyNumber in URLs */
			/* are now 1-indexed for better human-readability. Firebase keyables */
			/* remain 0-indexed. */
			if (activeBranch.title === 'public' && pubData.releases && pubData.releases.length) {
				return versionNumber
					? res.redirect(`${prefix}/release/${Number(versionNumber) + 1}`)
					: res.redirect(`${prefix}/release/${pubData.releases.length}`);
			}
			return versionNumber
				? res.redirect(`${prefix}/draft/${Number(versionNumber) + 1}${accessHashString}`)
				: res.redirect(`${prefix}/draft${accessHashString}`);
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
