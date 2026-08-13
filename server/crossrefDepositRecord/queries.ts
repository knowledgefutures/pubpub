import type { DepositStatus } from 'utils/crossref/depositStatus';

import { CrossrefDepositRecord } from 'server/models';

/**
 * The parts of a deposit's outcome that live in columns rather than inside the
 * depositJson blob, so the dashboard and the DOI display rule can read one field
 * instead of digging through a registrar payload.
 */
export type DepositState = {
	status?: DepositStatus | null;
	doilyDepositId?: string | null;
	doi?: string | null;
	error?: string | null;
	lastCheckedAt?: Date | null;
};

export const createCrossrefDepositRecord = ({
	depositJson,
	...depositState
}: { depositJson: any } & DepositState) => {
	return CrossrefDepositRecord.create({
		depositJson,
		...depositState,
	});
};

export const updateCrossrefDepositRecord = ({ crossrefDepositRecordId, ...values }) => {
	return CrossrefDepositRecord.update(values, {
		where: { id: crossrefDepositRecordId },
	});
};
