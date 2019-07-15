/* eslint-disable no-console */
import Color from 'color';
import { Op } from 'sequelize';
import {
	Community as v5_Community,
	Discussion as v5_Discussion,
	Pub as v5_Pub,
} from '../v5/models';

import {
	Community as v6_Community,
	Discussion as v6_Discussion,
	Pub as v6_Pub,
} from '../../../server/models';

Promise.all([])
	.then(() => {
		/* Community */
		console.log('Migrating Community');
		return v5_Community
			.findAll({
				where: {
					id: { [Op.ne]: '99608f92-d70f-46c1-a72c-df272215f13e' },
				},
			})
			.then((queryResult) => {
				const updateCommunities = queryResult.map((community) => {
					const accentWasLight = Color(community.accentColor).isLight();
					const updateData = {
						accentColorLight: accentWasLight ? community.accentColor : '#FFFFFF',
						accentColorDark: !accentWasLight ? community.accentColor : '#000000',
						headerColorType: accentWasLight ? 'light' : 'dark',
					};
					return v6_Community.update(updateData, {
						where: { id: community.id },
					});
				});
				return Promise.all(updateCommunities);
			});
	})
	.then(() => {
		/* Pub */
		return v5_Pub
			.findAll({
				where: {
					communityId: { [Op.ne]: '99608f92-d70f-46c1-a72c-df272215f13e' },
				},
			})
			.then((pubsData) => {
				const updatePubs = pubsData.map((pub) => {
					console.log(pub.id);
					const updateData = {
						headerBackgroundType: pub.avatar && pub.useHeaderImage ? 'image' : 'color',
						headerBackgroundImage: pub.useHeaderImage ? pub.avatar : null,
					};
					return v6_Pub.update(updateData, {
						where: { id: pub.id },
					});
				});
				return Promise.all(updatePubs);
			});
	})
	.then(() => {
		/* Discussions */
		console.log('Migrating Discussion');
		return v5_Discussion
			.findAll({
				where: {
					highlights: { [Op.ne]: null },
				},
			})
			.then((discussionsData) => {
				const updateDiscussions = discussionsData.map((discussion) => {
					const { exact, prefix, suffix } = discussion.highlights[0];
					const updateData = {
						initAnchorText: {
							prefix: prefix,
							exact: exact,
							suffix: suffix,
						},
					};
					return v6_Discussion.update(updateData, {
						where: { id: discussion.id },
					});
				});
				return Promise.all(updateDiscussions);
			});
	})
	.catch((err) => {
		console.log('Error with Migration', err);
	})
	.finally(() => {
		console.log('Ending Migration');
		process.exit();
	});
