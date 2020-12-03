export const createContext = ({ actor, markCreated, resolveChildren, parents = [] }) => {
	return {
		actor: actor,
		markCreated: markCreated,
		resolveChildren: resolveChildren,
		parents: parents,
		extend: function(nextObj) {
			return createContext({ ...this, ...nextObj });
		},
		extendWithParent: function(parentObj) {
			return createContext({ ...this, parents: { ...this.parents, ...parentObj } });
		},
	};
};
