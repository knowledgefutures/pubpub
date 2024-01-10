import type { TsRestRequest } from '@ts-rest/express';
import type { AppRouteQuery, ServerInferRequest } from '@ts-rest/core';
import type { ModelCtor } from 'sequelize-typescript';
import { Op } from 'sequelize';
import type { Express, Response } from 'express-serve-static-core';

import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';
import { SerializedModel } from 'types/serializedModel';

import { buildWhereClause } from './buildWhereClause';
import { createIncludes } from './include';
import type { GetManyQueryAny } from './createGetManyQuery';

export type CustomScopeInput = {
	/** The associated model you want to make sure is scoped to the community. */
	model: ModelCtor;
	/** The alias of the model you want to make sure is scoped to the community. */
	as: string;
	/**
	 * This is the foreign key of the model that is being queried.
	 *
	 * @example
	 *
	 * ```markdown
	 * You are querying `Member` and want to make sure the `pubId` of the member is in the community.
	 *
	 * Then the `foreignKey` would be `pubId`
	 * ```
	 */
	foreignKey: string;
	/**
	 * This is the identifier of the communityId in the model. You should only specify this if the
	 * communityId is not called `communityId`, e.g. `id` for the `Community` model
	 *
	 * @default `communityId`
	 */
	communityIdIdentifier?: string;
};

export const createCustomWhereClause = (
	customScopeInput: CustomScopeInput[],
	communityId: string,
) => {
	const whereMap = customScopeInput.map(
		({ as, foreignKey, communityIdIdentifier = 'communityId' }) => ({
			[Op.and]: [
				{
					[foreignKey]: {
						[Op.not]: null,
					},
				},
				{
					[`$${as}.${communityIdIdentifier}$`]: communityId,
				},
			],
		}),
	);
	return {
		...(whereMap.length && {
			where: {
				[Op.or]: whereMap,
			},
		}),
		includes: customScopeInput.map(({ model, as }) => ({
			model,
			as,
		})),
	};
};

export const queryMany =
	<M extends ModelCtor>(
		model: M,
		options?: {
			/** If provided, this will create additional where clauses to make sure that the */
			customScope?: CustomScopeInput[];
		},
	) =>
	async <T extends AppRouteQuery>(
		input: ServerInferRequest<T, Express['request']['headers']> & {
			req: TsRestRequest<T>;
			res: Response;
		},
	) => {
		const { req, query } = input;

		const community = await ensureUserIsCommunityAdmin(req);

		const {
			limit,
			offset,
			attributes,
			orderBy: order,
			sortBy: sort,
			filter,
			include = [],
			...rest
		} = (query as GetManyQueryAny) ?? {};

		const modelAttributes = model.getAttributes();

		// users can supply things like ?slug=foo instead of ?filter={slug: 'foo'}, we filter those out here
		const restQueryFilterParams = rest
			? Object.fromEntries(Object.entries(rest).filter(([k]) => k in modelAttributes))
			: {};

		const filterParams = {
			...restQueryFilterParams,
			...(filter && filter),
		};

		const modelHasCommunityId = 'communityId' in modelAttributes;

		const shouldScopeToCommunity = !options?.customScope && modelHasCommunityId;

		const whereClause = (filter || restQueryFilterParams) && buildWhereClause(filterParams);

		const { includes, where } = createCustomWhereClause(
			options?.customScope ?? [],
			community.id,
		);

		// if you include a field but aren't adding it to the attributes, sequelize will throw an error
		const filteredInclude = attributes
			? include.filter(
					(includeItem) =>
						(attributes as string[]).includes(includeItem) &&
						!includes.some((customIncludeItem) => customIncludeItem.as === includeItem),
			  )
			: include;

		const defaultIncludes = createIncludes(model, filteredInclude);

		const result = (await model.findAll({
			where: {
				// @ts-expect-error FIXME: The 'filter' type does not work well generically
				...(Object.keys(whereClause).length > 0 && whereClause),
				...(shouldScopeToCommunity && { communityId: community.id }),
				...where,
			},
			order: [[sort ?? 'createdAt', order ?? 'DESC']],
			...(attributes && { attributes }),
			limit: limit ?? 10,
			offset: offset ?? 0,
			include: [...defaultIncludes, ...includes],
			// the 'SerializedModel' type is kind of cheating since this isn't actually a serialized model,
			// but since this is only used to be returned immediately to the client, which forces it to be serialized, it's fine
		})) as SerializedModel<InstanceType<M>>[];

		return {
			body: result,
			status: 200 as const,
		};
	};
