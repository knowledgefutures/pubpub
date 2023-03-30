import passportOAuth1 from 'passport-oauth1';

import { User, ZoteroIntegration, IntegrationDataOAuth1 } from 'server/models';
import { isDuqDuq, isDevelopment } from 'utils/environment';
import { expect } from 'utils/assert';

const baseRedirectUrl = isDuqDuq()
	? 'https://duqduq.org'
	: isDevelopment()
	? 'http://lvh.me:9876'
	: 'https://pubpub.org';

export const zoteroAuthStrategy = () =>
	new passportOAuth1.Strategy(
		{
			requestTokenURL: 'https://www.zotero.org/oauth/request',
			accessTokenURL: 'https://www.zotero.org/oauth/access',
			userAuthorizationURL: 'https://www.zotero.org/oauth/authorize',
			consumerKey: process.env.ZOTERO_CLIENT_KEY,
			consumerSecret: process.env.ZOTERO_CLIENT_SECRET,
			callbackURL: `${baseRedirectUrl}/auth/zotero/redirect`,
			signatureMethod: 'HMAC-SHA1',
			passReqToCallback: true,
		},
		(req, accessToken, tokenSecret, params, profile, cb) => {
			const userId = req.user.id;
			const { username: zoteroUsername, userID: zoteroUserId } = params;
			return User.findOne({
				where: { id: userId },
				include: {
					model: ZoteroIntegration,
					required: false,
					include: { model: IntegrationDataOAuth1, required: false },
				},
			})
				.then((user) => {
					if (!user.zoteroIntegration) {
						return IntegrationDataOAuth1.create({ accessToken }).then(
							(integrationData) =>
								ZoteroIntegration.create({
									userId: user.id,
									zoteroUsername,
									zoteroUserId,
									integrationDataOAuth1Id: integrationData.id,
								}),
						);
					}
					const integration = user.zoteroIntegration;
					return IntegrationDataOAuth1.findOne({
						where: { id: integration.integrationDataOAuth1Id },
					})
						.then((oldData) => expect(oldData).update({ accessToken }))
						.then(() => integration);
				})
				.then(() => {
					cb(null, req.user);
				})
				.catch((err) => cb(err));
		},
	);
