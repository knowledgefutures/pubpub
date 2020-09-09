export type EditorChangeObject = {
	selectedNode?: {
		attrs?: {
			targetId?: string;
		};
	};
	updateNode: (...args: unknown[]) => unknown;
	view: {
		state: Object;
	};
};
