import type { Model, ModelCtor } from 'sequelize-typescript';

import { DataTypes, type Sequelize } from 'sequelize';

import {
	ALL_FACET_DEFINITIONS,
	type FacetName,
	type FacetProp,
	type FacetProps,
} from '../../facets';
import { createSequelizeHooksForFacetModel } from './hooks';
import { FacetBinding } from './models/facetBinding';

type Column = {
	type: (typeof DataTypes)[keyof typeof DataTypes];
	allowNull: true;
	defaultValue: null;
};

const getSequelizePropDefinition = (prop: FacetProp<any, any>): Column => {
	const {
		propType: { postgresType },
	} = prop;
	return {
		type: postgresType,
		allowNull: true,
		defaultValue: null,
	};
};

const getSequelizePropsDefinition = (props: FacetProps) => {
	const columns: Record<string, Column> = {};
	Object.entries(props).forEach(([name, prop]) => {
		columns[name] = getSequelizePropDefinition(prop);
	});
	return columns;
};

export const createSequelizeModelsFromFacetDefinitions = (sequelize: Sequelize) => {
	const modelsByName: Record<string, any> = {};
	Object.values(ALL_FACET_DEFINITIONS).forEach((facet) => {
		const { name, props } = facet;
		const FacetModel = sequelize.define(
			name,
			{
				...getSequelizePropsDefinition(props),
				id: (sequelize as any).idType,
				facetBindingId: { type: DataTypes.UUID, allowNull: false },
			},
			{
				tableName: name,
				indexes: [
					{
						fields: ['facetBindingId'],
					},
				],
			},
		) as any;
		FacetModel.belongsTo(FacetBinding, {
			foreignKey: 'facetBindingId',
			as: 'facetBinding',
			onDelete: 'CASCADE',
		});
		modelsByName[name] = FacetModel;
		createSequelizeHooksForFacetModel(facet, FacetModel);
	});
	return {
		facetModels: modelsByName as {
			[N in FacetName]: ModelCtor<
				Model<FacetProps[N], Omit<FacetProps[N], '__facetProp' | 'propType'>>
			>;
		},
		FacetBinding,
	};
};
