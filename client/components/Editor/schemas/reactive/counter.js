export const counter = (counterType, nodeFingerprintFn) => {
	const hasFingerprint = !!nodeFingerprintFn;

	return function(node) {
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
