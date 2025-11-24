import type { PubAttributionCreationParams, UpdateParams } from 'types';

import type { Permissions } from './permissions';

import assert from 'assert';

import { includeUserModel, PubAttribution } from 'server/models';
import { expect } from 'utils/assert';
import ensureUserForAttribution from 'utils/ensureUserForAttribution';

export const getPubAttributions = (pubId) => PubAttribution.findAll({ where: { id: pubId } });

export const createPubAttribution = async ({
	userId,
	pubId,
	name,
	order,
	isAuthor,
	orcid,
	roles,
	affiliation,
}: PubAttributionCreationParams) => {
	const newAttribution = await PubAttribution.create(
		{
			userId,
			pubId,
			orcid,
			name,
			roles,
			affiliation,
			order,
			isAuthor,
		},
		{
			include: [includeUserModel({ as: 'user', required: false })],
		},
	);
	const populatedPubAttribution = expect(
		await PubAttribution.findOne({
			where: { id: newAttribution.id },
			attributes: { exclude: ['updatedAt'] },
			include: [includeUserModel({ as: 'user', required: false })],
			useMaster: true,
		}),
	);

	const populatedPubAttributionJson = populatedPubAttribution.toJSON();

	if (populatedPubAttribution.user) {
		return populatedPubAttributionJson;
	}

	assert(!!populatedPubAttributionJson.name);
	return ensureUserForAttribution(populatedPubAttributionJson);
};

export const updatePubAttribution = async (
	inputValues: UpdateParams<PubAttribution> & { pubAttributionId: string },
	updatePermissions: Permissions['update'],
) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {} as Pick<
		typeof inputValues,
		Exclude<typeof updatePermissions, false | undefined>[number]
	>;
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions && updatePermissions.some((update) => update === key)) {
			filteredValues[key] = inputValues[key];
		}
	});

	await PubAttribution.update(filteredValues, {
		where: { id: inputValues.pubAttributionId },
	});
	return filteredValues;
};

export const destroyPubAttribution = (inputValues: { pubAttributionId: string }) => {
	return PubAttribution.destroy({
		where: { id: inputValues.pubAttributionId },
	});
};
