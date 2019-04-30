import { Branch, BranchPermission, User } from '../models';
import { attributesPublicUser, generateHash } from '../utils';

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
				order: (1 - maxOrder) / 2 + maxOrder,
				viewHash: generateHash(8),
				editHash: generateHash(8),
				pubId: inputValues.pubId,
			});
		})
		.then((newBranch) => {
			return BranchPermission.create({
				permissions: 'manage',
				userId: userId,
				pubId: inputValues.pubId,
				branchId: newBranch.id,
			});
		})
		.then((newBranchPermission) => {
			return Branch.findOne({
				where: {
					id: newBranchPermission.branchId,
				},
				attributes: [
					'createdAt',
					'id',
					'shortId',
					'title',
					'description',
					'submissionAlias',
					'order',
					'communityAdminPermissions',
					'publicPermissions',
					'viewHash',
					'editHash',
				],
				include: [
					{
						model: BranchPermission,
						as: 'permissions',
						required: false,
						include: [
							{
								model: User,
								as: 'user',
								attributes: attributesPublicUser,
							},
						],
					},
				],
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
