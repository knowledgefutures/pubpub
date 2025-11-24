import type { Graph } from 'graphlib';
import type { Model } from 'sequelize';

import { builders } from './builders';
import { link, type ModelDefinition } from './link';
import { sequelizeModels } from './models';
import { parse } from './parse';
import { buildProxyObject } from './proxy';

type BuildNames = keyof typeof builders;

const isBuildName = (name: string): name is BuildNames => {
	// @ts-expect-error FIXME: this is only called from vitest, so it's fine
	return Object.hasOwn(builders, name);
};

const buildForModelName = (modelName: string, args: any): Promise<Model> => {
	if (isBuildName(modelName)) {
		const builderFn = builders[modelName];
		return builderFn(args);
	}
	const model = sequelizeModels[modelName];
	return model.create(args);
};

const buildModelFromDefinition = async (
	modelDefinition: ModelDefinition,
	graph: InstanceType<typeof Graph>,
	resolvedModelsById: {
		[key: string]: Model;
	},
) => {
	const { id, properties, modelName, boundName } = modelDefinition;
	const foreignKeys: {
		[key: string]: string;
	} = {};
	for (const { v, w } of graph.outEdges(id) ?? []) {
		const association = graph.edge(v, w);
		// TODO: Remove this type assertion once we have inference from sequelize models
		// Models should indeed have an Id
		const targetModel = resolvedModelsById[w] as Model & { id: string };
		const { foreignKey } = association;
		foreignKeys[foreignKey] = targetModel.id;
	}
	const args = { ...properties, ...foreignKeys };
	try {
		const x = await buildForModelName(modelName, args);
		return x;
	} catch (err: any) {
		console.error(err);
		const boundNameString = boundName ? ` ${boundName}` : '';
		const argsString = Object.entries(args)
			.map(([key, value]) => `\t${key}: ${JSON.stringify(value)}`)
			.join('\n');
		throw new Error(
			`Got ${err.message} while building ${modelName}${boundNameString}:\n${argsString}`,
		);
	}
};

const indexDefinitionsById = (definitions: ModelDefinition[]) => {
	const index: {
		[key: string]: ModelDefinition;
	} = {};
	for (const def of definitions) {
		index[def.id] = def;
	}
	return index;
};

const templatize = (strings: TemplateStringsArray, ...slots: any[]) => {
	const parameters: {
		[key: string]: any;
	} = {};
	const slotReplacements: string[] = [];
	for (const slotValue of slots) {
		const paramName = 'P' + Object.keys(parameters).length.toString();
		parameters[paramName] = slotValue;
		slotReplacements.push('$' + paramName);
	}

	let query = '';
	for (let i = 0; i < strings.length; i++) {
		query += strings[i];
		if (slotReplacements[i]) {
			query += slotReplacements[i];
		}
	}

	return { query, parameters };
};

export const modelize = (strings: TemplateStringsArray, ...slots: any[]) => {
	const { query, parameters } = templatize(strings, ...slots);
	const ast = parse(query);
	const { definitions, graph, subsets } = link(ast, parameters);
	const resolvedModelsById: {
		[key: string]: any;
	} = {};
	const resolvedModelsByBoundName: {
		[key: string]: any;
	} = {};
	const definitionsById = indexDefinitionsById(definitions);

	const resolve = async () => {
		for (const subset of subsets) {
			// biome-ignore lint/performance/noAwaitInLoops: shhhhhh
			await Promise.all(
				subset.map(async (id) => {
					const definition = definitionsById[id];
					const { boundName } = definition;
					const model = await buildModelFromDefinition(
						definition,
						graph,
						resolvedModelsById,
					);
					resolvedModelsById[id] = model;
					if (boundName) {
						if (resolvedModelsByBoundName[boundName]) {
							throw new Error(
								`Modelize found duplicate bound identifier ${boundName} in template.`,
							);
						}
						resolvedModelsByBoundName[boundName] = model;
					}
				}),
			);
		}
		return resolvedModelsByBoundName;
	};

	const resolvePromise = resolve();
	return buildProxyObject(resolvePromise);
};
