import zoteroClient from 'zotero-api-client';

import app from 'server/server';
import { CitationStyleKind } from 'utils/citations';

import { ZoteroStyleKind } from 'types';

import { expect } from 'utils/assert';
import { ZoteroIntegration, IntegrationDataOAuth1 } from '../models';

// mapping our citation style keys to zotero's keys
const zoteroStyleKindMap: Record<CitationStyleKind, ZoteroStyleKind> = {
	'acm-siggraph': 'acm-siggraph',
	'american-anthro': 'american-anthropological-association',
	apa: 'apa-6th-edition',
	'apa-7': 'apa',
	'arcadia-science': 'arcadia-science',
	cell: 'cell',
	chicago: 'chicago-note-bibliography',
	harvard: 'harvard-cite-them-right',
	elife: 'elife',
	frontiers: 'frontiers',
	mla: 'modern-language-association',
	vancouver: 'vancouver',
	ama: 'american-medical-association',
};

// the parameters which can be passed to the get() method
// can be found at https://www.zotero.org/support/dev/web_api/v3/basics
app.get('/api/citations/zotero', (req, res) => {
	const userId = req.user?.id;
	const { q, include, style = 'apa' } = req.query;
	const zoteroStyle = zoteroStyleKindMap[style as CitationStyleKind];
	if (!userId) return new Error('Log in to request citations');
	return ZoteroIntegration.findOne({
		where: { userId },
		include: { model: IntegrationDataOAuth1 },
	})
		.then((zoteroIntegration) => {
			if (!zoteroIntegration) {
				throw new Error('No zotero integration found');
			}
			const { integrationDataOAuth1 } = zoteroIntegration;
			if (!integrationDataOAuth1) {
				throw new Error('Zotero not authenticated');
			}
			const zoteroId = parseInt(expect(zoteroIntegration.zoteroUserId), 10);
			const zoteroAPI = zoteroClient(integrationDataOAuth1.accessToken).library(
				'user',
				zoteroId,
			);
			return zoteroAPI.items().get({ q, include, style: zoteroStyle });
		})
		.then((results) => res.status(200).json({ items: results.raw }));
});
