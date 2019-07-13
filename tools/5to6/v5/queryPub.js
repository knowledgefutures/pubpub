const { Op } = require('sequelize');
const { Community, Discussion, Pub, Version, VersionPermission } = require('./models');

const getAllPubIds = async () => {
	const pubs = await Pub.findAll({
		where: {
			communityId: { [Op.ne]: '99608f92-d70f-46c1-a72c-df272215f13e' },
		},
		attributes: ['id'],
	});
	return pubs.map((pub) => pub.id);
};

const queryPub = async (pubId) => {
	const pub = await Pub.findOne({
		where: { id: pubId },
		include: [
			{ model: Version, as: 'versions' },
			{ model: VersionPermission, as: 'versionPermissions' },
			{ model: Community, as: 'community' },
			{ model: Discussion, as: 'discussions' },
		],
	});
	if (pub) {
		return {
			...pub.toJSON(),
			versions: pub.versions.sort((foo, bar) => {
				if (foo.createdAt < bar.createdAt) {
					return -1;
				}
				if (foo.createdAt > bar.createdAt) {
					return 1;
				}
				return 0;
			}),
		};
	}
	return null;
};

const getPubModelLatestUpdateTime = (pubModel) => {
	const maxTimeOf = (models) => {
		return models.reduce((maxTime, next) => {
			const time = new Date(next.updatedAt).getTime();
			return Math.max(maxTime, time);
		}, 0);
	};
	return Math.max(
		new Date(pubModel.updatedAt).getTime(),
		maxTimeOf(pubModel.versions),
		maxTimeOf(pubModel.versionPermissions),
		maxTimeOf(pubModel.discussions),
	);
};

const queryPubUpdatedTimes = async () =>
	Pub.findAll({
		attributes: { include: ['updatedAt', 'id'] },
		include: [
			{ model: Discussion, as: 'discussions', attributes: { include: ['updatedAt'] } },
			{ model: Version, as: 'versions', attributes: { include: ['updatedAt'] } },
			{
				model: VersionPermission,
				as: 'versionPermissions',
				attributes: { include: ['updatedAt'] },
			},
		],
	}).then((pubs) =>
		pubs.reduce((idToUpdateMap, nextPub) => {
			return { ...idToUpdateMap, [nextPub.id]: nextPub.updatedAt };
		}),
	);

module.exports = {
	queryPub: queryPub,
	queryPubUpdatedTimes: queryPubUpdatedTimes,
	getAllPubIds: getAllPubIds,
	getPubModelLatestUpdateTime: getPubModelLatestUpdateTime,
};
