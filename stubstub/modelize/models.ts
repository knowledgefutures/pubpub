// import { Model, ModelStatic } from 'sequelize';
import * as models from '../../server/models';

const {
	facetModels,
	includeUserModel: _,
	attributesPublicUser: __,
	sequelize: ___,
	...restModels
} = models;

export const sequelizeModels: {
	[key: string]: any; // ModelStatic<Model<any, any>>;
} = { ...facetModels, ...restModels };
