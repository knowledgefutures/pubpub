import React, { createRef, useRef } from 'react';

export const useRefMap = <T = any>() => {
	const { current: refsObject } = useRef<Record<string, React.RefObject<T>>>({});
	return {
		getRef: (key: string) => {
			const existingRef = refsObject[key];
			if (existingRef) {
				return existingRef;
			}
			const newRef = createRef<T>();
			refsObject[key] = newRef;
			return newRef;
		},
		refs: refsObject,
	};
};
