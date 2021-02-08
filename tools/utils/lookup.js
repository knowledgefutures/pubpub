import { Branch, Pub } from 'server/models';

export const lookupPub = async ({ slug, id }) => {
	if (!slug && !id) {
		throw new Error('Cannot find a Pub without a slug or ID');
	}
	const pub = await Pub.findOne({
		where: {
			...(id && { id }),
			...(slug && { slug }),
		},
	});
	if (!pub) {
		throw new Error(`No matching Pub found.`);
	}
	return pub;
};

export const lookupBranch = async ({ pubId, branchTitle }) => {
	const branch = await Branch.findOne({
		where: { pubId, title: branchTitle },
	});
	if (!branch) {
		throw new Error(`No branch by name ${branchTitle} for Pub ${pubId}.`);
	}
	return branch;
};
