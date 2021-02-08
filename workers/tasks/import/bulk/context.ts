export const createContext = ({ actor, markCreated, resolveChildren, parents = [] }) => {
	return {
		actor,
		markCreated,
		resolveChildren,
		parents,
		extend(nextObj) {
			return createContext({ ...this, ...nextObj });
		},
		extendWithParent(parentObj) {
			return createContext({ ...this, parents: { ...this.parents, ...parentObj } });
		},
	};
};
