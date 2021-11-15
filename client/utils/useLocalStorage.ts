import { useContext, useEffect, useMemo, useState } from 'react';
import { useBeforeUnload } from 'react-use';
import { useDebounce } from 'use-debounce';

import { ClientOnlyContext } from 'components';

import { getCommunityLocalStorage, LocalStorable } from './localStorage';

type Options<T extends LocalStorable> = {
	communityId: string;
	featureName: string;
	path: string[];
	initial: () => T;
	debounce: number;
	warnBeforeUnload?: boolean;
};

export const useLocalStorage = <T extends LocalStorable>(options: Options<T>) => {
	const {
		communityId,
		featureName,
		path,
		initial,
		debounce = 0,
		warnBeforeUnload = false,
	} = options;
	const { isClientOnly } = useContext(ClientOnlyContext);

	if (!isClientOnly) {
		throw new Error(
			process.env.NODE_ENV === 'production'
				? ''
				: 'Components that call useLocalStorage() must be within a <ClientOnly> component',
		);
	}

	const storage = useMemo(
		() =>
			path.reduce(
				(parent, entry) => parent.getChild(entry),
				getCommunityLocalStorage(communityId, featureName),
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[communityId, featureName, ...path],
	);

	const [initialValue] = useState(() => storage.getItem() as T | null);
	const [value, setValue] = useState<T>(() => initialValue ?? initial());
	const [debouncedValue] = useDebounce(value, debounce);
	const flushed = value === debouncedValue;

	useEffect(() => void storage.setItem(debouncedValue), [storage, debouncedValue]);
	useBeforeUnload(!flushed && warnBeforeUnload);

	return { value, setValue, initialValue, flushed };
};
