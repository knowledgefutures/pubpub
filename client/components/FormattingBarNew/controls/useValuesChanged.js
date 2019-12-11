import { useState, useRef, useEffect } from 'react';

export const useValuesChanged = (values) => {
	const [hasChanged, setHasChanged] = useState(false);
	const originalValues = useRef(values);

	useEffect(() => {
		setHasChanged(values.some((value, index) => value !== originalValues.current[index]));
	}, [values]);

	return hasChanged;
};
