import KeenAnalysis from 'keen-analysis';

import app from 'server/server';
import { getInitialData } from 'server/utils/initData';
import { sequelize } from 'server/models';
import { getListGrowth } from 'server/utils/mailchimp';

const processQueryData = function(baseObj, activeObj) {
	baseObj.forEach((o, i) => {
		const el = o;
		el.active = 0;
		const prev = baseObj[i - 1];
		if (activeObj) {
			activeObj.forEach((ao) => {
				if (ao.month === el.month) {
					el.active = ao.active;
				}
			});
		}
		if (i > 0) {
			el.prev = prev.prev + prev.current;
			el.growth = el.current / el.prev;
		} else if (i === 0) {
			el.prev = el.current;
			el.growth = 0;
		}
	});
	return baseObj;
};

app.get('/api/admin-dashboard', (req, res) => {
	return getInitialData(req).then((initialData) => {
		const user = req.user || {};
		const users = [
			'b242f616-7aaa-479c-8ee5-3933dcf70859',
			'5d9d63b3-6990-407c-81fb-5f87b9d3e360',
			'807f3604-4223-4495-b576-861d04d2f39e',
			'237fe275-0618-4a8f-bd40-ea9065836e67',
		];
		if (!users.includes(user.id)) {
			return res.status(404).json('Page not found.');
		}
		const stats = {};

		const countUsers = sequelize.query(
			`select count(*)::integer as "current", DATE_TRUNC('month', "Users"."createdAt")::date as "month"
		from "Users"
		GROUP BY "month"
		ORDER BY "month" asc`,
			{ type: sequelize.QueryTypes.SELECT },
		);

		const countCommunities = sequelize.query(
			`select count(*)::integer as "current", DATE_TRUNC('month', "Communities"."createdAt")::date as "month"
		from "Communities"
		GROUP BY "month"
		ORDER BY "month" asc`,
			{ type: sequelize.QueryTypes.SELECT },
		);

		const countDiscussions = sequelize.query(
			`select count(*)::integer as "current", DATE_TRUNC('month', "Discussions"."createdAt")::date as "month"
		from "Discussions"
		GROUP BY "month"
		ORDER BY "month" asc`,
			{ type: sequelize.QueryTypes.SELECT },
		);

		const countActiveCommunities = sequelize.query(
			`select count(DISTINCT "communityId")::integer as "active", month
		FROM ((select "Pages"."communityId", DATE_TRUNC('month', "Pages"."updatedAt")::date as "month" from "Pages")
		UNION
		(select "Discussions"."communityId", DATE_TRUNC('month', "Discussions"."updatedAt")::date as "month" from "Discussions")
		UNION
		(select "Pubs"."communityId", DATE_TRUNC('month', "Pubs"."updatedAt")::date as "month" from "Pubs")
		UNION
		(select "CommunityAdmins"."communityId", DATE_TRUNC('month', "CommunityAdmins"."updatedAt")::date as "month" from "CommunityAdmins")
		UNION
		(select "Collections"."communityId", DATE_TRUNC('month', "Collections"."updatedAt")::date as "month" from "Collections")
		UNION
		(select "Pages"."communityId", DATE_TRUNC('month', "Pages"."updatedAt")::date as "month" from "Pages")
		UNION
		(select "Pubs"."communityId", DATE_TRUNC('month', "Versions"."updatedAt")::date as "month" from "Versions" join "Pubs" on "Pubs".id = "Versions"."pubId"))
		as ActiveCommunities
		GROUP BY month`,
			{ type: sequelize.QueryTypes.SELECT },
		);

		const keenClient = new KeenAnalysis({
			projectId: initialData.locationData.isProd
				? '5b57a01ac9e77c0001eef181'
				: '5b5791b9c9e77c000175ca3b',
			readKey: initialData.locationData.isProd
				? '5CF12741FA41DC030D092D2B6D247344B3C25183E9862A598D452F59B346BC5CD667E1C2B2DA03CFDE17339312D3880BC20C1051DAA146CAFF2ABA684FCE5B4B8985FF9C9EEC4406C3D851F0E81D67B33E65431FB39963378B9A8D8925B9C081'
				: 'E4C526BC021F960D2C84AB1521E8D1D3F0D1089292947A27880D43F83997554C5F95F34DD9E16A18B5F5FC0809A415AF4A2E74AAF9379B51520924BF2B692598FF80D751E8E6EC63F3B931432DF394799EFC0E0E6C100ED64C1E628873E9D16C',
		});

		const startDate = '2018-10-01T00:00:00.000Z';

		const countActiveUsers = keenClient.query({
			analysis_type: 'count_unique',
			event_collection: 'pageviews',
			cache:
				req.headers.referer.indexOf('localhost') > -1
					? { maxAge: 10 * 60 * 1000 } /* 10 minutes */
					: false,
			target_property: 'pubpub.userId',
			timeframe: {
				// TODO: We need to set the start date based on the earliest visible entry.
				start: startDate,
				end: new Date().toISOString(),
			},
			interval: 'monthly',
		});

		const countSubscribers = getListGrowth('2847d5271c');

		return Promise.all([
			countUsers,
			countCommunities,
			countDiscussions,
			countActiveCommunities,
			countActiveUsers,
			countSubscribers,
		])
			.then(
				([
					userCountData,
					communityCountData,
					discussionCountData,
					activeCommunityData,
					activeUserData,
					subscriberData,
				]) => {
					const activeUsersObj = activeUserData.result.map((i) => {
						return {
							active: i.value,
							month: i.timeframe.start.split('T')[0],
						};
					});
					stats.users = processQueryData(userCountData, activeUsersObj);
					stats.communities = processQueryData(communityCountData, activeCommunityData);
					stats.discussions = processQueryData(discussionCountData);
					stats.activeCommunities = activeCommunityData;

					const subscribersObj = subscriberData.history.map((i) => {
						return {
							prev: i.existing,
							current: i.optins + i.imports,
							month: `${i.month}-01`,
							growth: (i.optins + i.imports) / i.existing,
						};
					});
					stats.subscribers = subscribersObj;

					stats.activeUsers = activeUsersObj;
					return res.status(200).json(stats);
				},
			)
			.catch((err) => {
				console.warn(err);
				return res.status(500).json('Internal server error');
			});
	});
});
