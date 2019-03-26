/**
 * An API route helper that retrieves community admin data for a user, or responds with a 403
 * error of the user is not a community admin (or the PubPub team).
 */
import { CommunityAdmin } from '../../models';

const PUBPUB_TEAM_ID = 'b242f616-7aaa-479c-8ee5-3933dcf70859';

// Lets us use the modelsMapping passed to communityAdminFor to ensure that the user isn't just a
// community admin, but they're a community admin for a community matching one or more additional
// models -- useful for when we want to assert that a user has permissions to edit a specific
// model that belongs to a community.
// For each {modelId: [Model, foreignKey]} in modelsMapping, return a promise that checks to see
// whether the Model m such that (id === modelId) has (m[foreignKey] === identification.communityId
// By default, foreignKey is "communityId" -- this is what most models use to describe which
// community they're related to.
const checkForeignKeys = (identification, modelsMapping) =>
	Object.entries(modelsMapping).map(([modelId], entry) => {
		if (!entry) {
			return Promise.resolve();
		}
		const [Model, foreignKey = 'communityId'] = entry;
		return new Promise((resolve, reject) =>
			Model.findOne({
				where: { id: identification[modelId] },
				attributes: [foreignKey],
			}).then((model) => {
				if (model && model[foreignKey] === identification.communityId) {
					resolve();
				} else {
					reject();
				}
			}),
		);
	});

export const communityAdminFor = (identification, modelsMapping) =>
	new Promise((resolve, reject) => {
		const { communityId, userId } = identification;
		if (userId === PUBPUB_TEAM_ID) {
			resolve();
		} else {
			CommunityAdmin.findOne({
				where: {
					communityId: communityId,
					userId: userId,
				},
			}).then((communityAdmin) => {
				if (modelsMapping) {
					Promise.all(checkForeignKeys(identification, modelsMapping))
						.then(() => resolve(communityAdmin))
						.catch((err) => reject(err));
				} else {
					resolve(communityAdmin);
				}
			});
		}
	});

const unauthorized = (res) => res.status(403).json('Not authorized as a community admin');

export const withCommunityAdmin = (fn) => (req, res, ctx = {}) => {
	if (!req.user) {
		return unauthorized(res);
	}
	const communityIdFromRequest = req.body.communityId || req.query.communityId;
	return communityAdminFor({ userId: req.user.id, communityId: communityIdFromRequest })
		.then((communityAdmin) => {
			return fn(req, res, { ...ctx, communityAdmin: communityAdmin });
		})
		.catch(() => unauthorized(res));
};
