import { Sequelize, DataTypes } from 'sequelize';

import { ALL_FACET_DEFINITIONS, FacetName, FacetProp, FacetProps } from '../../facets';

type Column = {
	type: typeof DataTypes[keyof typeof DataTypes];
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
	const FacetBinding = sequelize.import('./models/facetBinding') as any;
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
			{ tableName: name },
		) as any;
		FacetModel.belongsTo(FacetBinding, {
			foreignKey: 'facetBindingId',
			as: 'facetBinding',
			onDelete: 'CASCADE',
		});
		modelsByName[name] = FacetModel;
		if (!process.env.PUBPUB_SYNCING_MODELS_FOR_TEST_DB) {
			// HACK(ian): Don't import this file while setting up the test DB because it has too
			// many non-relative imports (see the comment in stubstub/global/setup.js for context).
			// eslint-disable-next-line global-require
			require('./hooks').createSequelizeHooksForFacetModel(facet, FacetModel);
		}
	});
	return {
		facetModels: modelsByName as Record<FacetName, any>,
		FacetBinding,
	};
};
