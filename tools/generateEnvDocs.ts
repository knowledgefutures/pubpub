/**
 * Generates infra/ENV.md from the Zod env schema defined in server/env.ts.
 *
 * Usage:
 *   npx tsx tools/generateEnvDocs.ts
 */

import type { z } from 'zod';

import fs from 'fs';
import path from 'path';

import { envSchema } from '../server/envSchema';

type ZodShape = Record<string, z.ZodTypeAny>;

function getInnerType(schema: z.ZodTypeAny): z.ZodTypeAny {
	// Unwrap ZodOptional, ZodDefault, ZodEffects (transform/refine)
	if ('_def' in schema) {
		const def = (schema as any)._def;
		if (def.typeName === 'ZodOptional' || def.typeName === 'ZodDefault') {
			return getInnerType(def.innerType);
		}
		if (def.typeName === 'ZodEffects') {
			return getInnerType(def.schema);
		}
		if (def.typeName === 'ZodUnion') {
			// For our booleanish helper, just report "boolean"
			return schema;
		}
	}
	return schema;
}

function getTypeName(schema: z.ZodTypeAny): string {
	const inner = getInnerType(schema);
	const def = (inner as any)._def;

	switch (def.typeName) {
		case 'ZodString':
			return 'string';
		case 'ZodNumber':
			return 'number';
		case 'ZodBoolean':
			return 'boolean';
		case 'ZodEnum':
			return def.values.map((v: string) => `\`"${v}"\``).join(' \\| ');
		case 'ZodUnion':
			return 'boolean';
		default:
			return 'string';
	}
}

function isRequired(schema: z.ZodTypeAny): boolean {
	const def = (schema as any)._def;
	if (def.typeName === 'ZodOptional') return false;
	if (def.typeName === 'ZodDefault') return false;
	// booleanish is optional().transform() → ZodEffects wrapping ZodOptional
	if (def.typeName === 'ZodEffects') return isRequired(def.schema);
	return true;
}

function getDefault(schema: z.ZodTypeAny): string | undefined {
	const def = (schema as any)._def;
	if (def.typeName === 'ZodDefault') {
		const val = def.defaultValue();
		if (val === undefined || val === '') return undefined;
		return String(val);
	}
	// booleanish defaults to false via transform
	if (def.typeName === 'ZodEffects') {
		const innerDefault = getDefault(def.schema);
		if (innerDefault !== undefined) return innerDefault;
		// booleanish with no explicit default → false
		const innerDef = (def.schema as any)?._def;
		if (innerDef?.typeName === 'ZodOptional') return '`false`';
	}
	return undefined;
}

function getDescription(schema: z.ZodTypeAny): string {
	if (schema.description) return schema.description;
	const def = (schema as any)._def;
	if (def.innerType?.description) return def.innerType.description;
	if (def.schema?.description) return def.schema.description;
	return '';
}

function main() {
	const shape = (envSchema as any).shape as ZodShape;

	const lines: string[] = [
		'# Environment Variables',
		'',
		'All environment variables used by PubPub, with types, defaults, and descriptions.',
		'',
		'> Auto-generated from `server/env.ts` — do not edit manually.',
		'> Run `npx tsx tools/generateEnvDocs.ts` to regenerate.',
		'',
	];

	// Group by section using the comments in the schema
	// We'll detect groups by looking at consecutive keys and inferring from descriptions
	const entries = Object.entries(shape);

	// Build a simple table
	lines.push(
		'| Variable | Type | Required | Default | Description |',
		'|----------|------|----------|---------|-------------|',
	);

	for (const [key, schema] of entries) {
		const type = getTypeName(schema);
		const required = isRequired(schema);
		const defaultVal = getDefault(schema);
		const description = getDescription(schema);

		lines.push(
			`| \`${key}\` | ${type} | ${required ? '**Yes**' : 'No'} | ${defaultVal ?? '—'} | ${description} |`,
		);
	}

	lines.push('');

	// Also generate a "required variables checklist" section
	lines.push('## Required Variables Checklist');
	lines.push('');
	lines.push('These must be set for the server to start:');
	lines.push('');

	for (const [key, schema] of entries) {
		if (isRequired(schema)) {
			const description = getDescription(schema);
			lines.push(`- [ ] \`${key}\` — ${description}`);
		}
	}

	lines.push('');

	const output = lines.join('\n');
	const outPath = path.join(__dirname, '..', 'infra', 'ENV.md');
	fs.writeFileSync(outPath, output);
	console.log(`Written to ${outPath}`);
}

main();
