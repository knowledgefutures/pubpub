export const isPubPublic = (pub, scopeData) => {
	return pub.releases.length || scopeData.canViewDraft;
};
