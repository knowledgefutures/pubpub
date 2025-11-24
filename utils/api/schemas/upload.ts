import { extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const textMimeTypes = [
	'text/tex-x',
	'text/yaml',
	'application/json',
	'application/xml',
	'application/mods+xml',
	'application/x-research-info-systems',
	'text/markdown',
	'text/plain',
	'application/x-tex',
] as const;
/**
 * Non-exhaustive list of mime-types that we allow to be uploaded to PubPub, minus image types,
 * which are handled separately.
 */
export const allowedMimeTypes = [
	...textMimeTypes,
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/epub+zip',
	'text/html',
	'application/vnd.oasis.opendocument.text',
	'application/pdf',
] as const;

export const fileSchema = z.union([
	z.custom<File>(),
	z
		.object({
			blob: z.custom<Blob>(),
			filename: z
				.string({
					description: 'Name of the file',
				})
				.min(1),
		})
		.openapi({ description: `Allowed mime types are: ${allowedMimeTypes.join(', ')}` }),
]);

export const mimeTypeSchema = z.union(
	[z.enum(allowedMimeTypes), z.string().regex(/image\/.*/)],
	{},
);

export const uploadSchema = z.object({
	file: fileSchema,
});

export const awsFormdataSchema = z.object({
	key: z.string(),
	AWSAccessKeyId: z.string(),
	acl: z.string(),
	policy: z.string(),
	signature: z.string(),
	'Content-Type': fileSchema,
	success_action_status: z.literal('200'),
	file: fileSchema,
});
