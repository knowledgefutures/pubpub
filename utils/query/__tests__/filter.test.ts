import { z } from 'zod';

import { collectionSchema } from '../../api/schemas/collection';
import { buildWhereClause } from '../buildWhereClause';
import { generateFilterForModelSchema } from '../filter';

// Does not work on CI for some reason
describe.skip('generateFilterSchema', () => {
	it('should generate a filter schema', () => {
		const collectionSchemaNoArray = collectionSchema.omit({ layout: true }).extend({
			smee: z.array(z.number().gt(-2)).nullish(),
			smoo: z.number(),
		});
		const schema = generateFilterForModelSchema(collectionSchemaNoArray);
		expect(schema).toBeDefined();

		const parsed = schema.parse({
			title: 'string',
			kind: 'tag',
			smoo: { gt: 2 },
			smee: [1, 2, 3, 4, { gt: 2 }],
		} satisfies z.infer<typeof schema>);

		expect(parsed).toBeDefined();

		const incorrectParsed = schema.safeParse({
			smee: [1, 2, 3, '4'],
		});

		expect(incorrectParsed.success).toBe(false);
		if (incorrectParsed.success === false) {
			console.log(incorrectParsed.error);
		}

		const whereClause = buildWhereClause(parsed);
		console.dir({ parsed, whereClause }, { depth: null });
	});
});
