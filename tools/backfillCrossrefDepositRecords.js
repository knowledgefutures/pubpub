import { Op } from 'sequelize';

import { managedDoiPrefixes } from 'utils/crossref/communities';
import { Pub, Collection, CrossrefDepositRecord } from 'server/models';

import { promptOkay } from './utils/prompt';

async function runForModel(model) {
	const tableName = model.getTableName();

	const models = await model.findAll({
		where: {
			doi: {
				[Op.like]: { [Op.any]: managedDoiPrefixes.map((prefix) => `%${prefix}%`) },
			},
			crossrefDepositRecordId: null,
		},
	});

	const yes = await promptOkay(
		`Create CrossrefDepositRecords for ${
			models.length
		} ${tableName} with the following DOI prefixes: \n${managedDoiPrefixes.join(', ')}?`,
		{
			throwIfNo: false,
			yesIsDefault: false,
		},
	);

	if (!yes) {
		return;
	}

	const depositRecords = await CrossrefDepositRecord.bulkCreate(models.map(() => ({})));

	const updates = models.map((model, i) => {
		return {
			...model.dataValues,
			crossrefDepositRecordId: depositRecords[i].id,
		};
	});

	console.log(`Associating CrossrefDepositRecords with ${models.length} ${tableName}...`);

	// Use bulkCreate to associate existing rows with the newly created
	// deposit records.
	await model.bulkCreate(
		updates,
		// Only update crossrefDepositRecordId field.
		{ updateOnDuplicate: ['crossrefDepositRecordId'] },
	);
}

async function main() {
	await runForModel(Pub);
	await runForModel(Collection);

	console.log('Done!');
}

main();
