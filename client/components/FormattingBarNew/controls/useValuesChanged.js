import { useState, useRef, useEffect } from 'react';

export const useValuesChanged = (values) => {
	const [hasChanged, setHasChanged] = useState(false);
	const originalValues = useRef(values);

	useEffect(() => {
		const hasChanges = values.some((value, index) => {
			return value !== originalValues.current[index];
		});
		setHasChanged(hasChanges);
	}, [values]);

	return hasChanged;
};
