import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import type { Request, Response } from 'express';
import { getUser } from 'server/utils/queryHelpers';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import { isUserAffiliatedWithCommunity } from 'server/community/queries';
import { expect } from 'utils/assert';
import { getCorrectHostname } from 'utils/caching/getCorrectHostname';

/**
 * Get the Fastly surroagate keys for a user.
 *
 * The user page is one of the few pages that is not cached at the community level,
 * we need to set keys for each community that the user has a pub in.
 *
 * That way, if any changes are made in any of those communities, the user page will be purged.
 */
const getHostnames = (attributions: Awaited<ReturnType<typeof getUser>>['attributions']) => {
	const hostNames = attributions.reduce((acc, attribution) => {
		const { domain, subdomain } = attribution.pub!.community!;

		if (acc[subdomain]) {
			return acc;
		}

		const correctHostname = getCorrectHostname(subdomain, domain);
		acc[subdomain] = correctHostname;
		return acc;
	}, {} as Record<string, string>);

	return Object.values(hostNames).join(' ');
};

const setSurrogateKeys = (
	req: Request,
	res: Response,
	userData: Awaited<ReturnType<typeof getUser>>,
) => {
	const hostnames = getHostnames(userData.attributions);
	const surrogateKeys = [userData.slug, hostnames, req.hostname].join(' ');

	res.setHeader('Surrogate-Key', surrogateKeys);
};

app.get(['/user/:slug', '/user/:slug/:mode'], async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		const customScripts = !initialData.locationData.isBasePubPub
			? await getCustomScriptsForCommunity(initialData.communityData.id)
			: undefined;
		const userData = expect(await getUser(req.params.slug, initialData));
		const isNewishUser = Date.now() - Number(userData.createdAt.valueOf()) < 1000 * 86400 * 30;

		if (!initialData.locationData.isBasePubPub) {
			const isThisUserAPartOfThisCommunity = await isUserAffiliatedWithCommunity(
				userData.id,
				initialData.communityData.id,
			);
			if (!isThisUserAPartOfThisCommunity) {
				return res.redirect(`https://www.pubpub.org/user/${userData.slug}`);
			}
		}

		setSurrogateKeys(req, res, userData);

		return renderToNodeStream(
			res,
			<Html
				chunkName="User"
				initialData={initialData}
				customScripts={customScripts}
				viewData={{ userData }}
				headerComponents={generateMetaComponents({
					initialData,
					title: `${userData.fullName} · PubPub`,
					description: userData.bio,
					image: userData.avatar,
					canonicalUrl: `https://www.pubpub.org/user/${userData.slug}`,
					unlisted: isNewishUser,
				})}
			/>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
