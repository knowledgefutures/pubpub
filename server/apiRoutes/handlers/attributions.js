/**
 * Helper functions for interacting with attribution models
 * (e.g. PubAttribution, CollectionAttribution)
 */
import { User } from '../../models';
import withPermissions from '../permissions/withPermissions';

const CAN_UPDATE_ATTRIBUTES = ['name', 'avatar', 'title', 'order', 'isAuthor', 'roles'];

const INCLUDE_USER_ATTRIBUTES = {
	model: User,
	as: 'user',
	required: false,
	attributes: ['id', 'firstName', 'lastName', 'fullName', 'avatar', 'slug', 'initials', 'title'],
};

export default (AttributionModel) =>
	withPermissions({
		createAttribution: (attribution) =>
			AttributionModel.create(attribution)
				.then((newAttribution) =>
					AttributionModel.findOne({
						where: { id: newAttribution.id },
						attributes: { exclude: ['updatedAt'] },
						include: [INCLUDE_USER_ATTRIBUTES],
					}),
				)
				.then((newModelWithUser) => {
					if (newModelWithUser.user) {
						return newModelWithUser.toJSON();
					}
					return {
						...newModelWithUser.toJSON(),
						user: {
							id: newModelWithUser.id,
							initials: newModelWithUser.name[0],
							fullName: newModelWithUser.name,
							firstName: newModelWithUser.name.split(' ')[0],
							lastName: newModelWithUser.name
								.split(' ')
								.slice(1, newModelWithUser.name.split(' ').length)
								.join(' '),
							avatar: newModelWithUser.avatar,
							title: newModelWithUser.title,
						},
					};
				}),
		updateAttribution: (modelId, requestToUpdate) => {
			const updatedAttribution = {};
			Object.keys(requestToUpdate).forEach((key) => {
				if (CAN_UPDATE_ATTRIBUTES.includes(key)) {
					updatedAttribution[key] = requestToUpdate[key];
				}
			});
			return AttributionModel.update(updatedAttribution, { where: { id: modelId } });
		},
		destroyAttribution: (modelId) => AttributionModel.destroy({ where: { id: modelId } }),
	});
