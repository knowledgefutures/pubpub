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

router.get('/privacy', (_, res) => res.redirect('/legal/privacy'));
router.get('/privacy/policy', (_, res) => res.redirect('/legal/privacy'));
router.get('/privacy/settings', (_, res) => res.redirect('/legal/settings'));
router.get('/tos', (_, res) => res.redirect('/legal/terms'));
router.get('/legal', (_, res) => res.redirect('/legal/terms'));

router.get('/legal/:tab', (req, res, next) => {
	if (!['terms', 'privacy', 'aup', 'settings'].includes(req.params.tab)) {
		return next();
	}
	const userId = req.user?.id;
	return Promise.all([
		getInitialData(req),
		userId ? getIntegrations(userId) : [],
		userId ? getOrCreateUserNotificationPreferences(userId) : undefined,
	])
		.then(([initialData, integrations, userNotificationPreferences]) => {
			return renderToNodeStream(
				res,
				// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; chunkName: string; init... Remove this comment to see the full error message
				<Html
					chunkName="Legal"
					initialData={initialData}
					viewData={{ integrations, userNotificationPreferences }}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Legal · ${initialData.communityData.title}`,
						description: initialData.communityData.description,
					})}
				>
					{/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ communityData: { title: string; descriptio... Remove this comment to see the full error message */}
					<Legal {...initialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
