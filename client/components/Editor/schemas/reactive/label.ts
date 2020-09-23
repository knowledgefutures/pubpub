export const label = () =>
	function(node) {
		// @ts-expect-error
		const { blockNames } = this.useDocumentState();
		return blockNames[node.type.name];
	};
