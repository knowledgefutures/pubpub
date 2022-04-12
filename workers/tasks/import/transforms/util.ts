type WalkablePrimitive = string | number | boolean | null;
type WalkableArray = Walkable[];
interface WalkableRecord {
	[key: string]: WalkableArray | WalkablePrimitive | WalkableRecord;
}

export type Walkable = WalkablePrimitive | WalkableRecord | WalkableArray;

export type Matcher<T> = (opts: { node: WalkableRecord; keyPath: string[] }) => null | T;
export type Replacer<T> = (opts: {
	entry: WalkableRecord;
	match: T;
	matchAndReplacers: MatchAndReplacer[];
	walk: Walker;
}) => Walkable;
export type MatchAndReplacer<T = any> = { matcher: Matcher<T>; replacer: Replacer<T> };

type Walker = (
	node: Walkable,
	matchAndReplacers: MatchAndReplacer[],
	keyPath?: string[],
) => Walkable;

export const walkAndReplace: Walker = (node, matchAndReplacers, keyPath = []) => {
	if (Array.isArray(node)) {
		return node
			.map((child) => walkAndReplace(child, matchAndReplacers, keyPath))
			.filter((x) => x);
	}
	if (node && typeof node === 'object') {
		for (let i = 0; i < matchAndReplacers.length; i++) {
			const { matcher, replacer } = matchAndReplacers[i];
			const match = matcher({ node, keyPath });
			if (match) {
				return replacer({
					entry: node,
					match,
					matchAndReplacers,
					walk: (innerNode, innerMatchAndReplacers = matchAndReplacers) =>
						walkAndReplace(innerNode, innerMatchAndReplacers, keyPath),
				});
			}
		}
		const newNode = {};
		Object.keys(node).forEach((key) => {
			newNode[key] = walkAndReplace(node[key], matchAndReplacers, [...keyPath, key]);
		});
		return newNode;
	}
	return node;
};
