const { Community, Discussion, Pub, Version, VersionPermission } = require('./models');

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
		return pub.toJSON();
	}
	return null;
};

const queryPubUpdatedTimes = async () =>
	Pub.findAll({
		attributes: { include: ['updatedAt', 'id'] },
	}).then((pubs) =>
		pubs.reduce((idToUpdateMap, nextPub) => {
			return { ...idToUpdateMap, [nextPub.id]: nextPub.updatedAt };
		}),
	);

module.exports = { queryPub: queryPub, queryPubUpdatedTimes: queryPubUpdatedTimes };
