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
		<PendingChanges.Provider value={{ pendingCount, pendingPromise }}>
			{children}
		</PendingChanges.Provider>
	);
};
export default PendingChangesProvider;
