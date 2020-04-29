import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { PendingChanges } from 'utils/hooks';

const propTypes = {
	children: PropTypes.node.isRequired,
};

const PendingChangesProvider = (props) => {
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
			value={{ pendingCount: pendingCount, pendingPromise: pendingPromise }}
		>
			{children}
		</PendingChanges.Provider>
	);
};

PendingChangesProvider.propTypes = propTypes;
export default PendingChangesProvider;
