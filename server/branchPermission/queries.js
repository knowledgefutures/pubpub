import { BranchPermission, User } from '../models';
import { attributesPublicUser } from '../utils';

export const createBranchPermission = (inputValues) => {
	return BranchPermission.create({
		userId: inputValues.userId,
		pubId: inputValues.pubId,
		branchId: inputValues.branchId,
		permissions: 'view',
	}).then((newBranchPermission) => {
		return BranchPermission.findOne({
			where: { id: newBranchPermission.id },
			include: [
				{
					model: User,
					as: 'user',
					attributes: attributesPublicUser,
				},
			],
		});
	});
};

export const updateBranchPermission = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return BranchPermission.update(filteredValues, {
		where: { id: inputValues.branchPermissionId },
	}).then(() => {
		return filteredValues;
	});
};

export const destroyBranchPermission = (inputValues) => {
	return BranchPermission.destroy({
		where: { id: inputValues.branchPermissionId },
	});
};
