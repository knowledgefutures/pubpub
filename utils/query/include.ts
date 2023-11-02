import { ModelCtor } from 'sequelize-typescript';
import {
	CollectionPub,
	Pub,
	Member,
	includeUserModel,
	CollectionAttribution,
	PubAttribution,
} from 'server/models';

export const globalAssociationsMap = {
	CollectionPub: {
		model: CollectionPub,
		as: 'collectionPubs',
		include: [
			{
				model: Pub,
				as: 'pub',
			},
		],
	},
	Member: {
		model: Member,
		as: 'members',
		include: includeUserModel({ as: 'user', required: false }),
	},
	CollectionAttribution: {
		model: CollectionAttribution,
		as: 'attributions',
		include: [includeUserModel({ as: 'user', required: false })],
	},

	PubAttribution: {
		model: PubAttribution,
		as: 'attributions',
		include: [includeUserModel({ as: 'user', required: false })],
	},
	User: includeUserModel({ as: 'user', required: false }),
} as const;

export const createIncludes = <M extends ModelCtor, Includes extends string[]>(
	model: M,
	includes: Includes,
) => {
	const associations = model.associations;
	return includes.map((include) => {
		const targetModel = associations[include]?.target;

		if (!targetModel) {
			throw new Error(`Invalid include: ${include}`);
		}

		const modelName = targetModel.name;
		if (modelName in globalAssociationsMap) {
			return globalAssociationsMap[modelName];
		}

		return {
			model: targetModel,
			as: include,
		};
	});
};
