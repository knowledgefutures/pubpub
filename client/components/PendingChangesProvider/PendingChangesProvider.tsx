import React, { useState, useCallback } from 'react';

import { PendingChanges } from 'utils/hooks';

type Props = {
	children: React.ReactNode;
};

const PendingChangesProvider = (props: Props) => {
	const { children } = props;
	const [pendingCount, setPendingCount] = useState(0);

	const decrementPendingCount = useCallback(() => setPendingCount((count) => count - 1), []);

	const pendingPromise = useCallback(
		(promise) => {
			setPendingCount((count) => count + 1);
			return promise
				.then((res) => {
					decrementPendingCount();
					return res;
				})
				.catch((err) => {
					decrementPendingCount();
					throw err;
				});
		},
		[decrementPendingCount],
	);

	return (
		<PendingChanges.Provider
			// @ts-expect-error ts-migrate(2322) FIXME: Object literal may only specify known properties, ... Remove this comment to see the full error message
			value={{ pendingCount: pendingCount, pendingPromise: pendingPromise }}
		>
			{children}
		</PendingChanges.Provider>
	);
};
export default PendingChangesProvider;
