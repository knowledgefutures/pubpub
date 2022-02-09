import { useRef } from 'react';

const noValueSignal = Symbol(0);

export const useLazyRef = <T>(initializer: () => T) => {
	const value = useRef<T>(noValueSignal as unknown as T);

	if (value.current === (noValueSignal as unknown as T)) {
		value.current = initializer();
	}

	return value;
};
