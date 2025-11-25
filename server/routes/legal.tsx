import React from 'react';

import { Router } from 'express';

import { Legal } from 'containers';
import Html from 'server/Html';
import { getOrCreateUserNotificationPreferences } from 'server/userNotificationPreferences/queries';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { getIntegrations } from 'server/utils/queryHelpers';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';

export const router = Router();

const tabToTitle = {
	terms: 'Terms of Service',
	privacy: 'Privacy Policy',
	aup: 'Acceptable Use Policy',
	settings: 'Privacy & Account',
};

router.get('/privacy', (_, res) => res.redirect('/legal/privacy'));
router.get('/privacy/policy', (_, res) => res.redirect('/legal/privacy'));
router.get('/privacy/settings', (_, res) => res.redirect('/legal/settings'));
router.get('/tos', (_, res) => res.redirect('/legal/terms'));
router.get('/legal', (_, res) => res.redirect('/legal/terms'));

router.get('/legal/:tab', async (req, res, next) => {
	if (!['terms', 'privacy', 'aup', 'settings'].includes(req.params.tab)) {
		return next();
	}

	try {
		const userId = req.user?.id;

		const [initialData, integrations, userNotificationPreferences] = await Promise.all([
			getInitialData(req),
			userId ? getIntegrations(userId) : [],
			userId ? getOrCreateUserNotificationPreferences(userId) : undefined,
		]);

		const title = tabToTitle[req.params.tab as keyof typeof tabToTitle];
		const isSettingsTab = req.params.tab === 'settings';

		return renderToNodeStream(
			res,
			// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; chunkName: string; init... Remove this comment to see the full error message
			<Html
				chunkName="Legal"
				initialData={initialData}
				viewData={{
					integrations,
					userNotificationPreferences,
					userEmail: isSettingsTab ? req.user?.email : undefined,
				}}
				headerComponents={generateMetaComponents({
					initialData,
					title: `${title} · ${initialData.communityData.title}`,
					description: initialData.communityData.description,
				})}
			>
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ communityData: { title: string; descriptio... Remove this comment to see the full error message */}
				<Legal {...initialData} />
			</Html>,
		);
	} catch (err) {
		return handleErrors(req, res, next)(err);
	}
});
