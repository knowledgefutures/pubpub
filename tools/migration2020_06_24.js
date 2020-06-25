import { Sequelize } from 'sequelize';
import { sequelize } from 'server/models';

console.info('Beginning Migration');
sequelize.queryInterface
	.addColumn('Pubs', 'metadata', { type: Sequelize.JSONB })
	.catch((err) => {
		console.info('Error with Migration', err);
	})
	.finally(() => {
		console.info('Ending Migration');
		process.exit();
	});
