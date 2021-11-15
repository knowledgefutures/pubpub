export type LocalStorable = Record<string, any>;

export type LocalStorageWriter<T extends LocalStorable> = {
	setItem: (item: T) => void;
	getItem: () => T;
	getChild: <U extends LocalStorable>(key: string) => LocalStorageWriter<U>;
};

// See https://en.wikipedia.org/wiki/Private_Use_Areas
const separator = '\uE000';

const assertPathEntryDoesNotContainSeparator = (entry: string) => {
	if (entry.includes(separator)) {
		if (process.env.NODE_ENV === 'production') {
			throw new Error();
		} else {
			throw new Error(
				`localStorage path entry "${entry}" contains forbidden separator character`,
			);
		}
	}
};

const createLocalStorageWriter = <T extends LocalStorable>(key: string): LocalStorageWriter<T> => {
	const setItem = (item: T) => {
		localStorage.setItem(key, JSON.stringify(item));
	};

	const getItem = (): T => {
		return JSON.parse(localStorage.getItem(key) ?? 'null');
	};

	const getChild = <U extends LocalStorable>(subkey: string) => {
		assertPathEntryDoesNotContainSeparator(subkey);
		return createLocalStorageWriter<U>(key + separator + subkey);
	};

	return { setItem, getItem, getChild };
};

const pubpubWriter = createLocalStorageWriter('pubpub');

export const getCommunityLocalStorage = <T extends LocalStorable>(
	communityId: string,
	featureName: string,
) => {
	return pubpubWriter.getChild(`community-${communityId}`).getChild<T>(featureName);
};
