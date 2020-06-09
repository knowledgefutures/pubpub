export const walkAndReplace = (node, matchAndReplacers) => {
	if (Array.isArray(node)) {
		return node.map((child) => walkAndReplace(child, matchAndReplacers)).filter((x) => x);
	}
	if (node && typeof node === 'object') {
		for (let i = 0; i < matchAndReplacers.length; i++) {
			const [matcher, replacer] = matchAndReplacers[i];
			const match = matcher(node);
			if (match) {
				return replacer({
					entry: node,
					match: match,
					matchAndReplacers: matchAndReplacers,
					walk: (innerNode, innerMatchAndReplacers = matchAndReplacers) =>
						walkAndReplace(innerNode, innerMatchAndReplacers),
				});
			}
		}
		const newNode = {};
		Object.keys(node).forEach((key) => {
			newNode[key] = walkAndReplace(node[key], matchAndReplacers);
		});
		return newNode;
	}
	return node;
};
