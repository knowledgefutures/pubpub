/* eslint-disable no-console, no-restricted-syntax */
class PubWithBranches {
	constructor(pub, draftBranch, branchByNameMap, versionToBranchPointerMap) {
		this.pub = pub;
		this.draftBranch = draftBranch;
		this.branchByNameMap = branchByNameMap;
		this.versionToBranchPointerMap = versionToBranchPointerMap;
	}

	serialize() {
		const draftBranch = this.draftBranch.serialize();
		const namedBranches = {};
		const versionToBranch = {};
		// const versionToShortCode = {};
		for (const [key, value] of this.branchByNameMap) {
			namedBranches[key] = value.serialize();
		}
		for (const [version, branchPointer] of this.versionToBranchPointerMap) {
			versionToBranch[version.id] = {
				name: branchPointer.branch.name,
				id: branchPointer.branch.id,
				key: branchPointer.v6MergeIndex,
				versionCreatedAt: version.createdAt,
			};
		}
		// for (const version of this.pub.versions) {
		// 	versionToShortCode[version.id] = version.viewHash;
		// }
		return {
			draftBranch: draftBranch,
			namedBranches: namedBranches,
			versionToBranch: versionToBranch,
			// versionToShortCode: versionToShortCode,
		};
	}
}

module.exports = PubWithBranches;
