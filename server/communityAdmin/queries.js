import { CommunityAdmin, User } from '../models';
import { subscribeUser } from '../utils/mailchimp';

export const createCommunityAdmin = (inputValues) => {
	return CommunityAdmin.create({
		userId: inputValues.userId,
		communityId: inputValues.communityId,
	})
		.then((newAdmin) => {
			return User.findOne({
				where: { id: newAdmin.userId },
				attributes: ['id', 'slug', 'fullName', 'initials', 'avatar', 'email'],
			});
		})
		.then((newAdminData) => {
			subscribeUser(newAdminData.email, 'be26e45660', ['Community Admins']);
			const adminDataJson = newAdminData.toJSON();
			delete adminDataJson.email;
			return adminDataJson;
		});
};

export const destroyCommunityAdmin = (inputValues) => {
	return CommunityAdmin.destroy({
		where: { communityId: inputValues.communityId, userId: inputValues.userId },
	});
};
