import { Sequelize } from 'sequelize';
import { sequelize, Pub } from '../../server/models';

export default async () => {
	// await sequelize.queryInterface.changeColumn('Pubs', 'headerStyle', {
	// 	type: Sequelize.ENUM('white-blocks', 'black-blocks', 'dark', 'light'),
	// });
	// await sequelize.queryInterface.removeColumn('Pubs', 'headerBackgroundType');
	// There are no pubs with headerBackgroundColor set yet...set them all to "light", which
	// represents a light and inoffensive grey color.
	await Pub.update({ headerBackgroundColor: 'light' }, { where: {} });
	// Any pubs without a header style will get set to "dark".
	await Pub.update({ headerStyle: 'dark' }, { where: { headerStyle: null } });
};
