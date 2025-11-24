import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

import { pandocFormatArray } from 'utils/import/formats';

extendZodWithOpenApi(z);

export const documentLabels = [
	'preamble',
	'document',
	'bibliography',
	'supplement',
	'metadata',
	'none',
] as const;

export const documentLabelSchema = z.enum(documentLabels);

export const baseSourceFileSchema = z.object({
	state: z.string().default('complete'),
	clientPath: z.string(),
	loaded: z.number(),
	total: z.number(),
	label: documentLabelSchema.optional().openapi({
		description: 'What kind of document this is',
	}),
});
export const sourceFileSchema = baseSourceFileSchema.extend({
	id: z.number().int().nonnegative(),
	assetKey: z.string().openapi({
		description: 'The key of the asset in AWS',
	}),
});

export const pandocFormatSchema = z.enum(pandocFormatArray);

export const importerFlagNames = [
	'extractEndnotes',
	'keepStraightQuotes',
	'skipJatsBibExtraction',
	'pandocFormat',
] as const;

export const importerFlagsSchema = z.object({
	extractEndnotes: z.boolean()?.optional(),
	keepStraightQuotes: z.boolean().optional(),
	skipJatsBibExtraction: z.boolean().optional(),
	pandocFormat: pandocFormatSchema.optional(),
});

export type ImporterFlags = (typeof importerFlagsSchema)['_input'];

export const createImportTaskSchema = z.object({
	sourceFiles: z.array(sourceFileSchema),
	importerFlags: importerFlagsSchema.default({}),
});

export type ImportBody = (typeof createImportTaskSchema)['_input'];

export type SourceFile = z.infer<typeof sourceFileSchema>;

export type BaseSourceFile = z.infer<typeof baseSourceFileSchema>;
