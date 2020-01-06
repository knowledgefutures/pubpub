import Promise from 'bluebird';
import React from 'react';
import { User as UserContainer } from 'containers';
import { isPubPublic } from 'shared/pub/permissions';
import { formatAndAuthenticatePub } from '../utils/formatPub';
import Html from '../Html';
import app from '../server';
import {
	Branch,
	Community,
	Pub,
	PubAttribution,
	User,
	CommunityAdmin,
	PubManager,
	BranchPermission,
} from '../models';
import { renderToNodeStream, getInitialData, handleErrors, generateMetaComponents } from '../utils';

app.get(['/user/:slug', '/user/:slug/:mode'], (req, res, next) => {
	const getUserData = User.findOne({
		where: {
			slug: req.params.slug.toLowerCase(),
		},
		attributes: {
			exclude: ['salt', 'hash', 'email', 'createdAt', 'updatedAt'],
		},
		include: [
			{
				model: PubAttribution,
				as: 'attributions',
				required: false,
				include: [
					{
						model: Pub,
						as: 'pub',
						attributes: ['id', 'title', 'description', 'slug', 'avatar', 'communityId'],
						include: [
							{
								// separate: true,
								model: Branch,
								as: 'branches',
								// required: true,
								include: [
									{
										model: BranchPermission,
										as: 'permissions',
										separate: true,
										required: false,
									},
								],
							},
							{
								model: PubManager,
								as: 'managers',
								separate: true,
								// required: false,
							},
							{
								model: Community,
								as: 'community',
								attributes: [
									'id',
									'subdomain',
									'domain',
									'title',
									'accentColorLight',
									'accentColorDark',
									'headerLogo',
									'headerColorType',
								],
							},
						],
					},
				],
			},
		],
	});

	return getInitialData(req)
		.then((initialData) => {
			const communityAdminQuery = CommunityAdmin.findOne({
				where: {
					userId: initialData.loginData.id,
					communityId: initialData.communityData.id || null,
				},
			});
			return Promise.all([initialData, getUserData, communityAdminQuery]);
		})

		.then(([initialData, userData, communityAdminData]) => {
			if (!userData) {
				throw new Error('User Not Found');
			}

			const userDataJson = userData.toJSON();

			if (userDataJson.attributions) {
				userDataJson.attributions = userDataJson.attributions.filter((attribution) => {
					const isOwnProfile = userDataJson.id === initialData.loginData.id;
					if (isOwnProfile) {
						return true;
					}
					const formattedPub = formatAndAuthenticatePub(
						{
							pub: {
								...attribution.pub,
								attributions: [{ ...attribution, user: userDataJson }],
							},
							loginData: initialData.loginData,
							communityAdminData: communityAdminData,
							req: { query: {}, params: {} },
						},
						false,
					);
					return formattedPub && isPubPublic(formattedPub);
				});
			}

			const newInitialData = {
				...initialData,
				userData: userDataJson,
			};
			return renderToNodeStream(
				res,
				<Html
					chunkName="User"
					initialData={newInitialData}
					headerComponents={generateMetaComponents({
						initialData: newInitialData,
						title: `${userDataJson.fullName} · PubPub`,
						description: userDataJson.bio,
						image: userDataJson.avatar,
						canonicalUrl: `https://www.pubpub.org/user/${userDataJson.slug}`,
					})}
				>
					<UserContainer {...newInitialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
