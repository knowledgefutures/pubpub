export const isPubPublic = (pub) => {
	return pub.branches && pub.branches.some((branch) => branch.publicPermissions !== 'none');
};
