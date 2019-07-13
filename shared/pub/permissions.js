export const isPubPublic = (pub) => {
	return (
		pub.branches &&
		pub.branches.some((branch) => {
			return branch.publicPermissions !== 'none' && branch.firstKeyAt;
		})
	);
};
