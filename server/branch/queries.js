import { Branch, BranchPermission } from '../models';
import { generateHash } from '../utils';
import { createFirebaseBranch } from '../utils/firebaseAdmin';

export const createBranch = (inputValues, userId) => {
	return Branch.findAll({
		where: {
			pubId: inputValues.pubId,
		},
		attributes: ['id', 'pubId', 'shortId', 'order'],
	})
		.then((branches) => {
			const maxShortId = branches.reduce((prev, curr) => {
				if (curr.shortId > prev) {
					return curr.shortId;
				}
				return prev;
			}, 0);
			const maxOrder = branches.reduce((prev, curr) => {
				if (curr.order > prev) {
					return curr.order;
				}
				return prev;
			}, 0);
			return Branch.create({
				shortId: maxShortId + 1,
				title: inputValues.title,
				description: inputValues.description,
				publicPermissions: inputValues.publicPermissions,
				pubManagerPermissions: inputValues.pubManagerPermissions,
				communityAdminPermissions: inputValues.communityAdminPermissions,
				order: (1 - maxOrder) / 2 + maxOrder,
				viewHash: generateHash(8),
				editHash: generateHash(8),
				pubId: inputValues.pubId,
			});
		})
		.then((newBranch) => {
			const newPermissions = [
				{ user: { id: userId }, permissions: 'manage' },
				...inputValues.userPermissions,
			];
			return Promise.all(
				newPermissions.map((permission) => {
					return BranchPermission.create({
						permissions: permission.permissions,
						userId: permission.user.id,
						pubId: inputValues.pubId,
						branchId: newBranch.id,
					});
				}),
			);
		})
		.then((newBranchPermissions) => {
			const baseBranchId = inputValues.baseBranchId;
			const newBranchId = newBranchPermissions[0].branchId;
			return Promise.all([
				newBranchId,
				createFirebaseBranch(inputValues.pubId, baseBranchId, newBranchId),
			]);
		})
		.then(([newBranchId]) => {
			return Branch.findOne({
				where: {
					id: newBranchId,
				},
				attributes: ['id', 'shortId'],
			});
		});
};

export const updateBranch = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	return Branch.update(filteredValues, {
		where: { id: inputValues.branchId },
	}).then(() => {
		return filteredValues;
	});
};

export const destroyBranch = (inputValues) => {
	return Branch.destroy({
		where: { id: inputValues.branchId },
	});
};
