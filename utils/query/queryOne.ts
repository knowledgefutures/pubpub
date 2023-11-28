import type { TsRestRequest } from '@ts-rest/express';
import type { AppRouteQuery, ServerInferRequest } from '@ts-rest/core';
import type { ModelCtor } from 'sequelize-typescript';
import { z } from 'zod';

import { ensureUserIsCommunityAdmin } from 'utils/ensureUserIsCommunityAdmin';
import { NotFoundError } from 'server/utils/errors';
import type { Express, Response } from 'express-serve-static-core';
import { createIncludes } from './include';
import { CustomScopeInput, createCustomWhereClause } from './queryMany';

const isUUID = (slugOrId: string) => z.string().uuid().safeParse(slugOrId).success;

export const queryOne =
	<M extends ModelCtor>(
		model: M,
		options?: {
			allowSlug?: boolean;
			customScope?: CustomScopeInput[];
		},
	) =>
	async <T extends AppRouteQuery>(
		input: ServerInferRequest<T, Express['request']['headers']> & {
			req: TsRestRequest<T>;
			res: Response;
		},
	) => {
		const { req, query, params } = input;

		const community = await ensureUserIsCommunityAdmin(req);

		const modelAttributes = model.getAttributes();
		const modelHasCommunityId = 'communityId' in modelAttributes;

		const bySlugOrId = options?.allowSlug
			? isUUID(params.slugOrId)
				? { id: params.slugOrId }
				: { slug: params.slugOrId }
			: { id: params.id };

		const { attributes, include = [] } = query;

		const { where, includes } = createCustomWhereClause(
			options?.customScope ?? [],
			community.id,
		);

		const filteredInclude = attributes
			? include.filter(
					(includeItem) =>
						(attributes as string[]).includes(includeItem) &&
						!includes.some((customIncludeItem) => customIncludeItem.as === includeItem),
			  )
			: include;

		const defaultIncludes = createIncludes(model, filteredInclude);

		const result = (await model.findOne({
			where: {
				...bySlugOrId,
				...(modelHasCommunityId && { communityId: community.id }),
				...where,
			},
			...(attributes && { attributes }),
			include: [...defaultIncludes, ...includes],
		})) as InstanceType<M>;

		if (!result) {
			throw new NotFoundError();
		}

		return {
			body: result.toJSON(),
			status: 200 as const,
		};
	};
