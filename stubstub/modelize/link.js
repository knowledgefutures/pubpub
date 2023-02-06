/* eslint-disable no-restricted-syntax */
import uuid from 'uuid/v4';
import * as graphlib from 'graphlib';

import { sequelizeModels } from './models';

const modelByName = (modelName) => {
	const model = sequelizeModels[modelName];
	if (!model) {
		throw new Error(`Modelize cannot find a model named ${modelName}`);
	}
	return model;
};

const walkAst = (ast, parameters) => {
	const definitionsByBoundName = {};
	const definitions = [];
	const resolveIdentifiersCallbacks = [];

	const lookupModelDefinitionByBoundId = (identifier) => {
		const modelDefinition = definitionsByBoundName[identifier];
		if (!modelDefinition) {
			throw new Error(`Could not resolve a reference to model ${identifier}.`);
		}
		return modelDefinition;
	};

	const resolveParameterOrLiteral = (paramOrLiteral) => {
		if (paramOrLiteral.type === 'parameter') {
			return parameters[paramOrLiteral.value];
		}
		return paramOrLiteral;
	};

	const walkModelBlock = (modelBlock) => {
		const { modelName, boundName, modelBlocks, identifiers, propertyEntries } = modelBlock;

		let properties = {};
		const referencedDefinitions = [];

		for (const innerModelBlock of modelBlocks) {
			const modelDefinition = walkModelBlock(innerModelBlock);
			referencedDefinitions.push({ implicit: true, modelDefinition });
		}

		for (const entry of propertyEntries) {
			if (entry.type === 'spread') {
				properties = { ...properties, ...resolveParameterOrLiteral(entry.value) };
			} else if (entry.type === 'keyValuePair') {
				const { key, value } = entry;
				if (value.type === 'modelBlock') {
					const modelDefinition = walkModelBlock(value);
					referencedDefinitions.push({ key, modelDefinition });
				} else if (value.type === 'identifier') {
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

		const thisModelDefinition = {
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

const getEdgeBetweenDefinitions = (a, b, associationName, isMandatory) => {
	const resolveAssociation = (source, target, association) => {
		const { associationType } = association;
		if (associationType === 'BelongsTo' || associationType === 'BelongsToMany') {
			return { from: source, to: target, association };
		}
		if (associationType === 'HasMany' || associationType === 'HasOne') {
			return { from: target, to: source, association };
		}
		throw new Error(`Unsupported associationType ${associationType}`);
	};

	const findImplicitAssociation = (source, target) => {
		const sourceModel = modelByName(source.modelName);
		const targetModel = modelByName(target.modelName);

		const associations = Object.values(sourceModel.associations).filter(
			(assoc) => assoc.target === targetModel,
		);

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
		.find((edge) => edge.association.associationType === 'BelongsTo');

	if (belongsToEdge) {
		return belongsToEdge;
	}

	return firstImplicitEdge || secondImplicitEdge;
};

const buildGraphFromDefinitions = (modelDefinitions) => {
	const graph = new graphlib.Graph();

	const addEdge = (from, to, association) => {
		if (from.id === to.id) {
			throw new Error(
				`Cannot add a self-edge on ${from.modelName} via ${association.foreignKey}`,
			);
		}
		graph.setEdge(from.id, to.id, association);
	};

	const visitDefinition = (
		modelDefinition,
		parentDefinitions,
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
					if (!graph.edge(from, to)) {
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

const buildPartialOrderingSubsets = (sourceGraph) => {
	if (!graphlib.alg.isAcyclic(sourceGraph)) {
		throw new Error(`Cannot resolve a dependency graph that contains a cycle`);
	}
	const subsets = [];

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

export const link = (ast, parameters) => {
	const { definitions, rootDefinitions } = walkAst(ast, parameters);
	const graph = buildGraphFromDefinitions(rootDefinitions);
	const subsets = buildPartialOrderingSubsets(graph);
	return { definitions, graph, subsets };
};
