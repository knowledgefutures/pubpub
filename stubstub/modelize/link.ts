/* eslint-disable no-restricted-syntax */
import uuid from 'uuid/v4';
import * as graphlib from 'graphlib';

import { Model, ModelCtor } from 'sequelize';
import { sequelizeModels } from './models';

const modelByName = (modelName: string) => {
	const model = sequelizeModels[modelName];
	if (!model) {
		throw new Error(`Modelize cannot find a model named ${modelName}`);
	}
	return model;
};

export type ModelDefinition = {
	id: string;
	modelName: string;
	boundName: string;
	properties: Record<string, any>;
	referencedDefinitions: ReferencedDefinition[];
};

export type ReferencedDefinition = {
	key?: string;
	shallow?: boolean;
	modelDefinition: ModelDefinition;
	implicit?: boolean;
};

export type ModelBlock = {
	type: 'modelBlock';
	modelName: string;
	boundName: string;
	propertyEntries: PropertyEntry[];
	identifiers: Identifier[];
	modelBlocks: ModelBlock[];
};

export type Parameter = {
	type: 'parameter';
	value: string;
};

export type Parameters = {
	[key: string]: any;
};

export type Identifier = {
	type: 'identifier';
	value: string;
};

export type Spread = {
	type: 'spread';
	value: Parameter;
};

export type KeyValuePair = {
	type: 'keyValuePair';
	key: string;
	value: Parameter | ModelBlock | Identifier | Literal;
};

export type PropertyEntry = Spread | KeyValuePair;

export type Literal = string | number | boolean | null | undefined;

export type AST = ModelBlock[];

const walkAst = (ast: ModelBlock[], parameters: Parameters) => {
	const definitionsByBoundName: {
		[boundName: string]: ModelDefinition;
	} = {};
	const definitions: ModelDefinition[] = [];
	const resolveIdentifiersCallbacks: (() => void)[] = [];

	const lookupModelDefinitionByBoundId = (identifier: string) => {
		const modelDefinition = definitionsByBoundName[identifier];
		if (!modelDefinition) {
			throw new Error(`Could not resolve a reference to model ${identifier}.`);
		}
		return modelDefinition;
	};

	const resolveParameterOrLiteral = (paramOrLiteral: Parameter | Literal) => {
		if (
			paramOrLiteral &&
			typeof paramOrLiteral === 'object' &&
			paramOrLiteral.type === 'parameter'
		) {
			return parameters[paramOrLiteral.value];
		}
		return paramOrLiteral as Literal;
	};

	const walkModelBlock = (modelBlock: ModelBlock) => {
		const { modelName, boundName, modelBlocks, identifiers, propertyEntries } = modelBlock;

		let properties: {
			[key: string]: any;
		} = {};
		const referencedDefinitions: ReferencedDefinition[] = [];

		for (const innerModelBlock of modelBlocks) {
			const modelDefinition = walkModelBlock(innerModelBlock);
			referencedDefinitions.push({ implicit: true, modelDefinition });
		}

		for (const entry of propertyEntries) {
			if (entry.type === 'spread') {
				const resolvedSpread = resolveParameterOrLiteral(entry.value);
				properties = {
					...properties,
					// Not sure what to do here, never seems to be called and
					// `resolveParameterOrLiteral` doesn't seem to return an object
					// but a string or a literal
					...(typeof resolvedSpread === 'object' &&
					!Array.isArray(resolvedSpread) &&
					resolvedSpread !== null
						? resolvedSpread
						: {
								[entry.value.value]: resolvedSpread,
						  }),
				};
			} else if (entry.type === 'keyValuePair') {
				const { key, value } = entry;
				if (value && typeof value === 'object' && value.type === 'modelBlock') {
					const modelDefinition = walkModelBlock(value);
					referencedDefinitions.push({ key, modelDefinition });
				} else if (value && typeof value === 'object' && value.type === 'identifier') {
					// value.value is the name of the identifier...sorry.
					const referencedId = value.value;
					resolveIdentifiersCallbacks.push(() => {
						const modelDefinition = lookupModelDefinitionByBoundId(referencedId);
						referencedDefinitions.push({
							key,
							shallow: true,
							modelDefinition,
						});
					});
				} else {
					properties[key] = resolveParameterOrLiteral(value);
				}
			}
		}

		identifiers.forEach((identifier) =>
			resolveIdentifiersCallbacks.push(() => {
				const modelDefinition = lookupModelDefinitionByBoundId(identifier.value);
				referencedDefinitions.push({
					implicit: true,
					shallow: true,
					modelDefinition,
				});
			}),
		);

		const thisModelDefinition: ModelDefinition = {
			id: uuid(),
			modelName,
			boundName,
			properties,
			referencedDefinitions,
		};

		if (boundName) {
			definitionsByBoundName[boundName] = thisModelDefinition;
		}

		definitions.push(thisModelDefinition);
		return thisModelDefinition;
	};

	const rootDefinitions = ast.map(walkModelBlock);
	resolveIdentifiersCallbacks.forEach((cb) => cb());
	return { definitions, rootDefinitions };
};

// This is an interface version of the Assocation abstract class from sequelize
// easier to work with
interface Association<S extends Model = Model, T extends Model = Model> {
	associationType: string;
	source: ModelCtor<S>;
	target: ModelCtor<T>;
	isSelfAssociation: boolean;
	isSingleAssociation: boolean;
	isMultiAssociation: boolean;
	as: string;
	isAliased: boolean;
	foreignKey: string;
	identifier: string;
	inspect(): string;
}

const getEdgeBetweenDefinitions = (
	a: ModelDefinition,
	b: ModelDefinition,
	associationName?: string | null,
	isMandatory?: boolean,
) => {
	const resolveAssociation = <T extends Association>(
		source: ModelDefinition,
		target: ModelDefinition,
		association: T,
	) => {
		const { associationType } = association;
		if (associationType === 'BelongsTo' || associationType === 'BelongsToMany') {
			return { from: source, to: target, association };
		}
		if (associationType === 'HasMany' || associationType === 'HasOne') {
			return { from: target, to: source, association };
		}
		throw new Error(`Unsupported associationType ${associationType}`);
	};

	const findImplicitAssociation = (source: ModelDefinition, target: ModelDefinition) => {
		const sourceModel = modelByName(source.modelName);
		const targetModel = modelByName(target.modelName);

		const associations = Object.values(sourceModel.associations).filter(
			(assoc) =>
				typeof assoc === 'object' &&
				assoc != null &&
				'target' in assoc &&
				assoc.target === targetModel,
		) as Association[];

		if (associations.length > 0) {
			if (associations.length > 1) {
				throw new Error(
					`Cannot infer association between ${source.modelName} and ${target.modelName}` +
						` because multiple such associations exist.`,
				);
			}
			return resolveAssociation(source, target, associations[0]);
		}
		return null;
	};

	const aModel = modelByName(a.modelName);
	const bModel = modelByName(b.modelName);

	if (associationName) {
		const association = aModel.associations[associationName];
		if (!association) {
			throw new Error(
				`Cannot find association from ${a.modelName} to ${b.modelName} by name ${associationName}.`,
			);
		} else if (association.target !== bModel) {
			throw new Error(
				`Attempted to use association ${association} on ${aModel}` +
					` to link to ${bModel}, but it links to ${association.target} instead.`,
			);
		}
		return resolveAssociation(a, b, association);
	}

	const firstImplicitEdge = findImplicitAssociation(a, b);
	const secondImplicitEdge = findImplicitAssociation(b, a);

	if (!firstImplicitEdge && !secondImplicitEdge && isMandatory) {
		throw new Error(`Failed to infer relationship between ${a.modelName} and ${b.modelName}.`);
	}

	const belongsToEdge = [firstImplicitEdge, secondImplicitEdge]
		.filter((x) => x)
		.find((edge) => edge?.association?.associationType === 'BelongsTo');

	if (belongsToEdge) {
		return belongsToEdge;
	}

	return firstImplicitEdge || secondImplicitEdge;
};

const buildGraphFromDefinitions = (modelDefinitions: ModelDefinition[]) => {
	const graph = new graphlib.Graph();

	const addEdge = <T extends Association>(
		from: ModelDefinition,
		to: ModelDefinition,
		association: T,
	) => {
		if (from.id === to.id) {
			throw new Error(
				`Cannot add a self-edge on ${from.modelName} via ${association.foreignKey}`,
			);
		}
		graph.setEdge(from.id, to.id, association);
	};

	const visitDefinition = (
		modelDefinition: ModelDefinition,
		parentDefinitions: ModelDefinition[],
		alreadyFoundImmediateParentEdge = false,
	) => {
		const { id, referencedDefinitions } = modelDefinition;
		const parentCount = parentDefinitions.length;
		graph.setNode(id, modelDefinition);
		for (const parentDefinition of parentDefinitions) {
			const isImmediateParent = parentDefinition === parentDefinitions[parentCount - 1];
			if (!alreadyFoundImmediateParentEdge || !isImmediateParent) {
				const edge = getEdgeBetweenDefinitions(
					parentDefinition,
					modelDefinition,
					null,
					false,
				);
				if (edge) {
					const { from, to, association } = edge;
					if (!graph.edge(from.id, to.id)) {
						addEdge(from, to, association);
					}
				}
			}
		}

		for (const { key, modelDefinition: innerDefinition, shallow } of referencedDefinitions) {
			const edge = getEdgeBetweenDefinitions(modelDefinition, innerDefinition, key, true);
			if (edge) {
				const { from, to, association } = edge;
				addEdge(from, to, association);
			}
			if (!shallow) {
				visitDefinition(innerDefinition, [...parentDefinitions, modelDefinition], !!edge);
			}
		}
	};

	modelDefinitions.forEach((def) => visitDefinition(def, []));
	return graph;
};

const buildPartialOrderingSubsets = (sourceGraph: graphlib.Graph) => {
	if (!graphlib.alg.isAcyclic(sourceGraph)) {
		throw new Error(`Cannot resolve a dependency graph that contains a cycle`);
	}
	const subsets: string[][] = [];

	// Clone the graph (🙄)
	const graph = graphlib.json.read(graphlib.json.write(sourceGraph));
	while (graph.nodeCount() > 0) {
		const sinks = graph.sinks();
		subsets.push(sinks);
		for (const sink of sinks) {
			graph.removeNode(sink);
		}
	}
	return subsets;
};

export const link = (ast: ModelBlock[], parameters: Parameters) => {
	const { definitions, rootDefinitions } = walkAst(ast, parameters);
	const graph = buildGraphFromDefinitions(rootDefinitions);
	const subsets = buildPartialOrderingSubsets(graph);
	return { definitions, graph, subsets };
};
