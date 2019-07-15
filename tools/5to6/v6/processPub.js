/* eslint-disable no-console */
import uuid from 'uuid';
import Sequelize from 'sequelize';

import { Branch, BranchPermission, Discussion, PubVersion } from '../../../server/models';
import { createHashMatcher } from '../util/hash';

const hashMatcher = createHashMatcher('transformUploadedHash', ['transformed.json']);

const generateHash = (length) => {
	const tokenLength = length || 32;
	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

	let hash = '';
	for (let index = 0; index < tokenLength; index += 1) {
		hash += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return hash;
};

const getBranchIdForVersionId = (versionPermission, transformed) => {
	const { draftBranch, namedBranches, versionToBranch } = transformed;
	const { versionId } = versionPermission;
	if (versionId && versionToBranch[versionId]) {
		const proposedBranchName = versionToBranch[versionId].name;
		if (proposedBranchName) {
			return namedBranches[proposedBranchName].id;
		}
		throw new Error(`No version -> branch mapping exists for version id ${versionId}`);
	} else {
		return draftBranch.id;
	}
};

const cleanBranchNames = (pubId, transformed) => {
	const { namedBranches, versionToBranch } = transformed;
	const branchNames = Object.keys(namedBranches);
	const overlyLongPublicBranchName = branchNames.find((name) => name.startsWith('public__'));
	if (branchNames.length === 1 && overlyLongPublicBranchName) {
		namedBranches.public = namedBranches[overlyLongPublicBranchName];
		Object.keys(versionToBranch).forEach((key) => {
			const branchObj = versionToBranch[key];
			if (branchObj.name === overlyLongPublicBranchName) {
				branchObj.name = 'public';
			}
		});
		delete namedBranches[overlyLongPublicBranchName];
	}
	if (!namedBranches.public) {
		namedBranches.public = { id: uuid.v4() };
	}
};

const updateBranches = async (model, transformed) => {
	const { id: pubId } = model;
	const { draftBranch, namedBranches, versionToBranch } = transformed;
	await BranchPermission.destroy({ where: { pubId: pubId } });
	await Branch.destroy({ where: { pubId: pubId } });
	await Branch.bulkCreate(
		[['draft', draftBranch]]
			.concat(Object.entries(namedBranches))
			.map(([title, branch], index, { length }) => {
				const sortedVToBValues = Object.values(versionToBranch)
					.filter((item) => {
						return item.id === branch.id;
					})
					.sort((foo, bar) => {
						if (foo.key < bar.key) {
							return -1;
						}
						if (foo.key > bar.key) {
							return 1;
						}
						return 0;
					});

				const firstKeyAtDate = branch.firstKeyAt ? new Date(branch.firstKeyAt) : undefined;
				const latestKeyAtDate = branch.latestKeyAt
					? new Date(branch.latestKeyAt)
					: undefined;
				const firstVersionDate = sortedVToBValues.length
					? new Date(sortedVToBValues[0].versionCreatedAt)
					: undefined;
				const latestVersionDate = sortedVToBValues.length
					? new Date(sortedVToBValues[sortedVToBValues.length - 1].versionCreatedAt)
					: undefined;

				return {
					id: branch.id,
					shortId: index + 1,
					title: title,
					order: title === 'public' ? 1 : index / length,
					viewHash: generateHash(8),
					discussHash: generateHash(8),
					editHash: generateHash(8),
					pubId: pubId,
					publicPermissions: title === 'public' ? 'discuss' : 'none',
					pubManagerPermissions: 'manage',
					communityAdminPermissions: 'manage',
					firstKeyAt: firstVersionDate || firstKeyAtDate,
					latestKeyAt: latestVersionDate || latestKeyAtDate,
				};
			}),
	);
	await BranchPermission.bulkCreate(
		model.versionPermissions.map((versionPermission) => {
			const { createdAt, permissions, updatedAt, userId } = versionPermission;
			const branchId = getBranchIdForVersionId(versionPermission, transformed);
			return {
				createdAt: createdAt,
				updatedAt: updatedAt,
				userId: userId,
				pubId: pubId,
				branchId: branchId,
				permissions: permissions,
			};
		}),
	);
};

const updateDiscussions = async (transformed) => {
	const { draftBranch, namedBranches } = transformed;
	return [draftBranch].concat(Object.values(namedBranches)).reduce((promise, branch) => {
		if (!branch.discussions) {
			return promise;
		}
		const discussionIds = Object.keys(branch.discussions);
		if (discussionIds.length === 0) {
			return promise;
		}
		return promise.then(() =>
			Discussion.update(
				{ branchId: branch.id },
				{ where: { id: { [Sequelize.Op.in]: discussionIds } } },
			),
		);
	}, Promise.resolve());
};

const createVersions = async (transformed, pubId) => {
	const { versionToBranch } = transformed;
	return PubVersion.bulkCreate(
		Object.keys(versionToBranch).map((versionId) => {
			const { id: branchId, key: historyKey, versionCreatedAt } = versionToBranch[versionId];
			return {
				id: versionId,
				branchId: branchId,
				historyKey: historyKey,
				pubId: pubId,
				createdAt: versionCreatedAt,
				updatedAt: versionCreatedAt,
			};
		}),
	);
};

const stripExtraneousKeys = (branchObj, strip = ['id', 'firstKeyAt', 'latestKeyAt']) => {
	const res = {};
	Object.keys(branchObj).forEach((key) => {
		if (strip.includes(key)) {
			return;
		}
		res[key] = branchObj[key];
	});
	return res;
};

const createFirebaseJson = (transformed, pubDir) => {
	const branches = {};
	const { draftBranch, namedBranches } = transformed;
	branches[`branch-${draftBranch.id}`] = stripExtraneousKeys(draftBranch);
	Object.values(namedBranches).forEach((branch) => {
		branches[`branch-${branch.id}`] = stripExtraneousKeys(branch);
	});
	pubDir.write('jsonToFirebase.json', JSON.stringify(branches));
	return branches;
};

const processPub = async (storage, pubId, writeToFirebase, { current, total }) => {
	console.log(`~~~~~~~~ Processing pub ${pubId} (${current}/${total}) ~~~~~~~~`);
	const pubDir = storage.within(`pubs/${pubId}`);
	if (pubDir.contents().indexOf('transformed.json') === -1) {
		console.log(`OK: No transformed.json for ${pubId}`);
		return false;
	}
	const model = JSON.parse(pubDir.read('model.json'));
	const { transformed } = JSON.parse(pubDir.read('transformed.json'));
	const firebaseJson = createFirebaseJson(transformed, pubDir);
	const hasTransformBeenUploaded = hashMatcher.matchHash(pubDir);
	if (hasTransformBeenUploaded) {
		console.log(`OK: already wrote ${pubId}`);
		return false;
	}
	try {
		cleanBranchNames(pubId, transformed);
		await PubVersion.destroy({ where: { pubId: pubId } });
		await updateBranches(model, transformed);
		await updateDiscussions(transformed);
		await createVersions(transformed, pubId);
		await writeToFirebase(pubId, firebaseJson);
		hashMatcher.updateHash(pubDir);
		console.log(`OK: wrote ${pubId} successfully!`);
	} catch (error) {
		console.log(`FAILURE: ${pubId}`);
		console.log(error);
	}
	return true;
};

module.exports = processPub;
