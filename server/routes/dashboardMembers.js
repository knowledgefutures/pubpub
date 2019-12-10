import React from 'react';
import Promise from 'bluebird';
import { DashboardMembers } from 'containers';
import Html from '../Html';
import app from '../server';
import {
	hostIsValid,
	renderToNodeStream,
	getInitialData,
	handleErrors,
	generateMetaComponents,
} from '../utils';
// import { getPermissionLevel } from '../utils/memberPermissions';

app.get(
	[
		'/dash/members',
		'/dash/collection/:collectionSlug',
		'/dash/collection/:collectionSlug/members',
		'/dash/pub/:pubSlug',
		'/dash/pub/:pubSlug/members',

		// '/dash/collection/:collectionSlug/:mode',
		// '/dash/collection/:collectionSlug/:mode/:submode',
		// '/dash/pub/:pubSlug/',
		// '/dash/pub/:pubSlug/:mode',
		// '/dash/pub/:pubSlug/:mode/:submode',
		// '/dash/:mode',
		// '/dash/:mode/:submode',
	],
	(req, res, next) => {
		if (!hostIsValid(req, 'community')) {
			return next();
		}

		return getInitialData(req)
			.then((initialData) => {
				return Promise.all([
					initialData,
					// getPermissionLevel({
					// 	userId: initialData.loginData.id,
					// 	targetId: 'd2112c45-7188-490e-a8c2-28542097a749',
					// 	targetType: 'pub',
					// }),
					'manage',
					// Member.findAll() // associated with this full stack
					// dashboard data, which will give the active elements at each scope, and active scope
				]);
			})
			.then(([initialData, permissionLevel]) => {
				// console.log('permissionLevel: ', permissionLevel);
				const mode = initialData.locationData.params.mode || 'overview';
				const capitalizeFirstLetter = (string) => {
					return string.charAt(0).toUpperCase() + string.slice(1);
				};
				// console.log(initialData.loginData.id, initialData.communityData.id);
				const newInitialData = {
					...initialData,
					// membersData: 
				}
				return renderToNodeStream(
					res,
					<Html
						chunkName="DashboardMembers"
						initialData={initialData}
						headerComponents={generateMetaComponents({
							initialData: initialData,
							title: `${capitalizeFirstLetter(mode)} · Dash`,
							unlisted: true,
						})}
					>
						<DashboardMembers {...newInitialData} />
					</Html>,
				);
			})
			.catch(handleErrors(req, res, next));
	},
);
