export const counter = (counterType, nodeFingerprintFn) => {
	const hasFingerprint = !!nodeFingerprintFn;

	return function(node) {
		// @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
		const counterState = this.useTransactionState(['counter', counterType], {
			countsMap: {},
			maxCount: 0,
		});

		if (hasFingerprint) {
			const fingerprint = JSON.stringify(nodeFingerprintFn(node));
			if (!counterState.countsMap[fingerprint]) {
				counterState.maxCount++;
				counterState.countsMap[fingerprint] = counterState.maxCount;
			}
			return counterState.countsMap[fingerprint];
		}

		counterState.maxCount++;
		return counterState.maxCount;
	};
};
