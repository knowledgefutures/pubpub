import React from 'react';

import Html from 'server/Html';
import app from 'server/server';
import { handleErrors } from 'server/utils/errors';
import { getInitialData } from 'server/utils/initData';
import { hostIsValid } from 'server/utils/routes';
import { generateMetaComponents, renderToNodeStream } from 'server/utils/ssr';
import { generateMetabaseToken } from 'server/utils/metabase';
import { User } from 'types';

app.get('/admin', (req, res, next) => {
	if (!hostIsValid(req, 'pubpub')) {
		return next();
	}

	return getInitialData(req)
		.then((initialData) => {
			const user = req.user || {};
			const users = [
				'b242f616-7aaa-479c-8ee5-3933dcf70859',
				'5d9d63b3-6990-407c-81fb-5f87b9d3e360',
				'807f3604-4223-4495-b576-861d04d2f39e',
				'237fe275-0618-4a8f-bd40-ea9065836e67',
				'06f7d120-391e-4d71-8725-dcd3e9b9af44',
				'408952a0-58a6-42df-86b8-d7fe3ab6ba43',
				'c575d640-4d72-4197-bc32-0cf383a34a4f',
				'af262062-bb64-402c-8cfc-165c27c2788a',
				'4d506b24-80b6-462c-85f0-f237e08010d5',
				'6ddd7a7b-c542-4127-b403-33a67eb40ff3',
				'd29eed4d-d754-4f8c-975e-b34826e6b8d2',
			];
			if (!users.includes((user as User).id)) {
				throw new Error('Page Not Found');
			}
			const impactData = {
				baseToken: generateMetabaseToken('pubpub', null, 'base'),
			};
			return renderToNodeStream(
				res,
				<Html
					chunkName="AdminDashboard"
					initialData={initialData}
					headerComponents={generateMetaComponents({
						initialData,
						title: `Admin Dashboard · ${initialData.communityData.title}`,
						description: initialData.communityData.description,
					})}
					viewData={{ impactData }}
				/>,
			);
		})
		.catch(handleErrors(req, res, next));
});
