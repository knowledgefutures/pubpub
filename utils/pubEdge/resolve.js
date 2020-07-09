export const getParentsAndChildrenForPub = ({
	inboundEdges,
	outboundEdges,
	allowUnapprovedRelationships,
}) => {
	const parents = [];
	const children = [];
	outboundEdges.forEach((edge) => {
		const { pubIsParent } = edge;
		(pubIsParent ? children : parents).push(edge);
	});
	inboundEdges.forEach((edge) => {
		const { pubIsParent, approvedByTarget } = edge;
		if (approvedByTarget || allowUnapprovedRelationships) {
			(pubIsParent ? parents : children).push(edge);
		}
	});
	return { parents: parents, children: children };
};
