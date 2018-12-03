import app from '../server';
import { sequelize } from '../models';

app.get('/api/dashboard', (req, res)=> {
	const user = req.user || {};
	const users = ['b242f616-7aaa-479c-8ee5-3933dcf70859', '5d9d63b3-6990-407c-81fb-5f87b9d3e360',
		'807f3604-4223-4495-b576-861d04d2f39e', '237fe275-0618-4a8f-bd40-ea9065836e67'];
	if (!users.includes(user.id)) { return res.status(404).json('Page not found.'); }
	const stats = {};

	const countUsers = sequelize.query(`select count(*), DATE_TRUNC('month', "Users"."createdAt") as "month"
	from "Users"
	GROUP BY DATE_TRUNC('month', "Users"."createdAt")
	ORDER BY "month" asc`, { type: sequelize.QueryTypes.SELECT });

	const countCommunities = sequelize.query(`select count(*), DATE_TRUNC('month', "Communities"."createdAt") as "month"
	from "Communities"
	GROUP BY DATE_TRUNC('month', "Communities"."createdAt")
	ORDER BY "month" asc`, { type: sequelize.QueryTypes.SELECT });

	const countDiscussions = sequelize.query(`select count(*), DATE_TRUNC('month', "Discussions"."createdAt") as "month"
	from "Discussions"
	GROUP BY DATE_TRUNC('month', "Discussions"."createdAt")
	ORDER BY "month" asc`, { type: sequelize.QueryTypes.SELECT });

	const countActiveCommunities = sequelize.query(`select count(DISTINCT "communityId"), month
	FROM ((select "Pages"."communityId", DATE_TRUNC('month', "Pages"."updatedAt") as "month" from "Pages")
	UNION
	(select "Discussions"."communityId", DATE_TRUNC('month', "Discussions"."updatedAt") as "month" from "Discussions")
	UNION
	(select "Pubs"."communityId", DATE_TRUNC('month', "Pubs"."updatedAt") as "month" from "Pubs")
	UNION
	(select "CommunityAdmins"."communityId", DATE_TRUNC('month', "CommunityAdmins"."updatedAt") as "month" from "CommunityAdmins")
	UNION
	(select "Tags"."communityId", DATE_TRUNC('month', "Tags"."updatedAt") as "month" from "Tags")
	UNION
	(select "Pages"."communityId", DATE_TRUNC('month', "Pages"."updatedAt") as "month" from "Pages")
	UNION
	(select "Pubs"."communityId", DATE_TRUNC('month', "Versions"."updatedAt") as "month" from "Versions" join "Pubs" on "Pubs".id = "Versions"."pubId"))
	as ActiveCommunities
	GROUP BY month`, { type: sequelize.QueryTypes.SELECT });

	return Promise.all([countUsers, countCommunities, countDiscussions, countActiveCommunities])
	.then(([userCountData, communityCountData, discussionCountData, activeCommunityCountData]) => {
		stats.users = userCountData;
		stats.communities = communityCountData;
		stats.discussions = discussionCountData;
		stats.activeCommunities = activeCommunityCountData;
		return res.status(200).json(stats);
	})
	.catch(err => { console.warn(err); return res.status(500).json('Internal server error'); });
});
