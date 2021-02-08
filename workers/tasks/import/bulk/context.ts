export const createContext = ({ actor, markCreated, resolveChildren, parents = [] }) => {
	return {
		actor,
		markCreated,
		resolveChildren,
		parents,
		extend: function(nextObj) {
			return createContext({ ...this, ...nextObj });
		},
		extendWithParent: function(parentObj) {
			return createContext({ ...this, parents: { ...this.parents, ...parentObj } });
		},
	};
};
