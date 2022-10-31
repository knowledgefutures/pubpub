import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { getUser } from 'server/utils/queryHelpers';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { getCustomScriptsForCommunity } from 'server/customScript/queries';
import { isUserAffiliatedWithCommunity } from 'server/community/queries';

app.get(['/user/:slug', '/user/:slug/:mode'], async (req, res, next) => {
	try {
		const initialData = await getInitialData(req);
		const customScripts = !initialData.locationData.isBasePubPub
			? await getCustomScriptsForCommunity(initialData.communityData.id)
			: undefined;
		const userData = await getUser(req.params.slug, initialData);
		const isNewishUser = Date.now() - userData.createdAt.valueOf() < 1000 * 86400 * 30;

		if (!initialData.locationData.isBasePubPub) {
			const isThisUserAPartOfThisCommunity = await isUserAffiliatedWithCommunity(
				userData.id,
				initialData.communityData.id,
			);
			if (!isThisUserAPartOfThisCommunity) {
				return res.redirect(`https://www.pubpub.org/user/${userData.slug}`);
			}
		}

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
