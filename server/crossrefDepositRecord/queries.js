import { CrossrefDepositRecord } from 'server/models';

export const createCrossrefDepositRecord = ({ depositJson }) => {
	return CrossrefDepositRecord.create({
		depositJson: depositJson,
	});
};

export const updateCrossrefDepositRecord = ({ crossrefDepositRecordId, ...values }) => {
	return CrossrefDepositRecord.update(values, {
		where: { id: crossrefDepositRecordId },
	});
};
