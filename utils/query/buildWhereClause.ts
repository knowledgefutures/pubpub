import { z } from 'zod';
import { Op, WhereOptions } from 'sequelize';
import type { FilterType, ObjectFilter } from './filter';

type ZodTypes =
	| z.ZodType<number>
	| z.ZodType<string>
	| z.ZodType<Date>
	| z.ZodType<Boolean>
	| z.ZodEnum<[string, ...string[]]>
	| z.ZodType<Record<string, any>>;

type FilterTypess<T> = T extends T ? FilterType<T> : never;
type FilterTypes = FilterTypess<ZodTypes>;

const buildFieldWhereClause = <T extends FilterTypes>(filterField: T, arrayDepth = 0) => {
	if (Array.isArray(filterField)) {
		return {
			[arrayDepth > 0 ? Op.and : Op.or]: filterField.map((filter) =>
				buildFieldWhereClause(filter, arrayDepth + 1),
			),
		};
	}

	if (typeof filterField === 'boolean') {
		if (filterField) {
			return { [Op.not]: null };
		}

		return { [Op.is]: null };
	}

	if (typeof filterField === 'object') {
		const w = Object.entries(filterField).reduce((acc, [key, value]) => {
			if (key === 'exact') {
				acc[Op.eq] = value;
			}
			if (key === 'contains') {
				acc[
					'not' in filterField && filterField.not ? Op.notILike : Op.iLike
				] = `%${value}%`;
			}

			if (['gt', 'lt', 'gte', 'lte', 'eq', 'ne'].includes(key)) {
				acc[Op[key]] = value;
			}

			return acc;
		}, {} as any);

		return w;
	}

	return filterField;
};

/**
 * Builds a Sequelize `where` clause based on the provided filters.
 * @param filters - An object containing the filters to apply to the query.
 * @returns A Sequelize `where` clause object.
 */
export const buildWhereClause = <T extends ObjectFilter<any>>(filters: T) => {
	const where: WhereOptions<z.infer<FilterType<T>>> = {};

	Object.keys(filters).forEach((key) => {
		const filterField = filters[key];
		where[key] = buildFieldWhereClause(filterField);
	});

	return where;
};
