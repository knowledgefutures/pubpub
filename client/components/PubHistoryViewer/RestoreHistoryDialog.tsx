import React, { useCallback, useMemo } from 'react';

import { Callback } from 'types';
import { ConfirmDialog } from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { usePubData } from 'client/containers/Pub/pubHooks';

import { renderTimeLabelForDate } from './utils';

type Props = {
	historyKey: number;
	dateForHistoryKey: null | Date;
	children: React.ComponentProps<typeof ConfirmDialog>['children'];
	onRestore: Callback;
};

const reassurance = (
	<>
		The existing draft contents will remain in your Pub's history. You can always restore back
		to the current state if you wish.
	</>
);

const renderError = () => {
	return <>There was a problem restoring the Pub contents.</>;
};

const RestoreHistoryDialog = (props: Props) => {
	const { children, historyKey, dateForHistoryKey, onRestore } = props;
	const { editHash, id: pubId } = usePubData();

	const confirmText = useMemo(() => {
		if (dateForHistoryKey) {
			const { date, time } = renderTimeLabelForDate(dateForHistoryKey);
			return (
				<>
					<p>
						Ready to restore this Pub draft back to its contents on{' '}
						<b>
							{date} at {time}
						</b>
						?
					</p>
					<p>{reassurance}</p>
				</>
			);
		}
		return null;
	}, [dateForHistoryKey]);

	const handleConfirm = useCallback(async () => {
		await apiFetch.post('/api/pubHistory/restore', {
			pubId,
			accessHash: editHash,
			historyKey,
		});
		onRestore();
	}, [editHash, historyKey, onRestore, pubId]);

	return (
		<ConfirmDialog
			confirmLabel="Restore"
			title="Restore Pub draft"
			text={confirmText}
			errorState={renderError}
			onConfirm={handleConfirm}
		>
			{children}
		</ConfirmDialog>
	);
};

export default RestoreHistoryDialog;
