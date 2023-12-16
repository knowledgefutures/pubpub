import zoteroClient from 'zotero-api-client';

import app, { wrap } from 'server/server';
import { CitationStyleKind } from 'utils/citations';

import { ZoteroStyleKind } from 'types';

import { expect } from 'utils/assert';
import { ForbiddenError, BadRequestError, NotFoundError } from 'server/utils/errors';

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
app.get(
	'/api/citations/zotero',
	wrap(async (req, res) => {
		const userId = req.user?.id;
		const { q, include, style = 'apa' } = req.query;
		const zoteroStyle = zoteroStyleKindMap[style as CitationStyleKind];

		if (!userId) {
			throw new ForbiddenError(new Error('Log in to request citations'));
		}

		if (!q) {
			throw new BadRequestError(new Error('No query provided'));
		}

		const zoteroIntegration = await ZoteroIntegration.findOne({
			where: { userId },
			include: { model: IntegrationDataOAuth1 },
		});

		if (!zoteroIntegration) {
			throw new NotFoundError(Error('No zotero integration found'));
		}

		const { integrationDataOAuth1 } = zoteroIntegration;

		if (!integrationDataOAuth1) {
			throw new ForbiddenError(Error('Zotero not authenticated'));
		}

		const zoteroId = parseInt(expect(zoteroIntegration.zoteroUserId), 10);
		const zoteroAPI = zoteroClient(integrationDataOAuth1.accessToken).library('user', zoteroId);
		const results = await zoteroAPI.items().get({ q, include, style: zoteroStyle });

		return res.status(200).json({ items: results.raw });
	}),
);
