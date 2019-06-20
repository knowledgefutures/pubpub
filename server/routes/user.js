import Promise from 'bluebird';
import React from 'react';
import { User as UserContainer } from 'containers';
import { isPubPublic } from 'shared/pub/permissions';
import Html from '../Html';
import app from '../server';
import { Branch, Community, Pub, PubAttribution, User } from '../models';
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
							{ model: Branch, as: 'branches' },
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
									'headerTextAccent',
								],
							},
						],
					},
				],
			},
		],
	});

	return Promise.all([getInitialData(req), getUserData])
		.then(([initialData, userData]) => {
			if (!userData) {
				throw new Error('User Not Found');
			}

			const userDataJson = userData.toJSON();
			if (userDataJson.pubs) {
				userDataJson.pubs = userDataJson.pubs.filter((item) => {
					const isOwnProfile = userDataJson.id === initialData.loginData.id;
					return isOwnProfile || isPubPublic(item);
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
					})}
				>
					<UserContainer {...newInitialData} />
				</Html>,
			);
		})
		.catch(handleErrors(req, res, next));
});
