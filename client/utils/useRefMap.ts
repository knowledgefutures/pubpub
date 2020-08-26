import { createRef, useRef } from 'react';

export const useRefMap = () => {
	const { current: refsObject } = useRef({});
	return {
		get: (key) => {
			const existingRef = refsObject[key];
			if (existingRef) {
				return existingRef;
			}
			const newRef = createRef();
			refsObject[key] = newRef;
			return newRef;
		},
	};
};
