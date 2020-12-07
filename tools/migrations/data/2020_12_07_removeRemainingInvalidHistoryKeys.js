import { Op } from 'sequelize';

import { Release } from 'server/models';

module.exports = async () => {
	return Release.update(
		{ historyKey: -1, historyKeyMissing: true },
		{ where: { historyKeyValidation: { [Op.ne]: 'validated' } } },
	);
};
