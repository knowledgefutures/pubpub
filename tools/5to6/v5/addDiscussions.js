/* eslint-disable no-console, no-restricted-syntax, no-continue */
const { error, warn } = require('../problems');
const prosemirrorBisect = require('../util/prosemirrorBisect');

const makeDiscussionEntry = (key, from, to, needsManualReanchor) => {
	const entry = {
		currentKey: key,
		initKey: key,
		initAnchor: from,
		initHead: to,
		selection: {
			type: 'text',
			a: from,
			h: to,
		},
	};
	if (needsManualReanchor) {
		entry.needsManualReanchor = true;
	}
	return entry;
};

const searchBranch = (branch, criterion) => {
	for (const entry of branch.getIntermediateDocStates(null, true)) {
		const test = criterion(entry);
		if (test) {
			return test;
		}
	}
	return null;
};

const addDiscussionToBranch = (discussion, { branch, targetIndex }, ignoreHighlight) => {
	const { highlights } = discussion;
	if (highlights && !ignoreHighlight) {
		const [highlight] = highlights;
		const exactMatch = searchBranch(branch, (entry) => {
			const [indexInBranch, { doc }] = entry;
			if (targetIndex !== undefined && indexInBranch !== targetIndex) {
				return null;
			}
			try {
				const highlightText = doc.textBetween(highlight.from, highlight.to);
				if (highlightText === highlight.exact) {
					return { entry: entry, highlight: highlight };
				}
				return null;
			} catch (e) {
				return null;
			}
		});
		const bestMatch =
			exactMatch ||
			searchBranch(branch, (entry) => {
				const { doc } = entry[1];
				if (doc.textContent.includes(highlight.exact)) {
					const bounds = prosemirrorBisect(doc, highlight.exact);
					if (bounds) {
						warn(
							`Making a best guess at highlight for discussion ${discussion.id} on branch ${branch.name}`,
						);
						return {
							entry: entry,
							highlight: { from: bounds.left, to: bounds.right },
						};
					}
				}
				return null;
			});
		if (bestMatch) {
			const {
				entry: [bestIndex],
				highlight: bestHighlight,
			} = bestMatch;
			branch.addDiscussion(
				discussion.id,
				makeDiscussionEntry(bestIndex, bestHighlight.from, bestHighlight.to),
			);
			return true;
		}
		return false;
	}
	branch.addDiscussion(
		discussion.id,
		makeDiscussionEntry(targetIndex || 1, null, null, ignoreHighlight),
	);
	return true;
};

const getCandidateBranchesForDiscussion = (pub, pubWithBranches, discussion) => {
	const targetVersionId =
		discussion.content &&
		discussion.content.content &&
		discussion.content.content.reduce((foundVersionId, contentItem) => {
			if (foundVersionId) {
				return foundVersionId;
			}
			if (contentItem.attrs && contentItem.attrs.version) {
				return contentItem.attrs.version;
			}
			return null;
		}, null);
	const targetVersion = pub.versions.find((v) => v.id === targetVersionId);
	if (targetVersion) {
		const branchPointer = pubWithBranches.versionToBranchPointerMap.get(targetVersion);
		return [
			{
				branch: branchPointer.branch,
				targetIndex: branchPointer.v6MergeIndex,
			},
		];
	}
	return Array.from(pubWithBranches.branchByNameMap.entries())
		.map(([key, branch]) => key.startsWith('public') && branch)
		.filter((x) => x)
		.sort((a, b) => b.getHighestIndex() - a.getHighestIndex())
		.concat([pubWithBranches.draftBranch])
		.map((branch) => ({ branch: branch }));
};

const logAttachAttempt = (discussion, { branch, targetIndex }, success) => {
	const result = success ? 'Attached' : 'Failed to attach';
	console.log(
		`${result} discussion ${discussion.id} to branch ${branch}${
			success
				? ''
				: ` at ${targetIndex !== undefined ? `target index ${targetIndex}` : 'any index'}`
		}`,
	);
};

module.exports = (pub, pubWithBranches, logAttempts = false) => {
	pub.discussions.forEach((discussion) => {
		const candidates = getCandidateBranchesForDiscussion(pub, pubWithBranches, discussion);
		if (candidates.length) {
			const succeeded = candidates.reduce((success, candidate) => {
				if (success) {
					return true;
				}
				const successHere = addDiscussionToBranch(discussion, candidate);
				if (logAttempts) {
					logAttachAttempt(discussion, candidate, successHere);
				}
				return successHere;
			}, false);
			if (!succeeded) {
				warn(
					`Failed to attach discussion ${discussion.id} to any branch. Will attach it to the draft branch.`,
				);
				const draftBranch = pubWithBranches.draftBranch;
				if (!draftBranch) {
					error(`No draft branch to accept orphan discussion ${discussion.id}`);
				}
				const fallbackSucceeded = addDiscussionToBranch(
					discussion,
					{
						targetIndex: draftBranch.getHighestIndex(),
						branch: draftBranch,
					},
					true,
				);
				if (!fallbackSucceeded) {
					error(`Fallback failed for discussion ${discussion.id}`);
				}
			}
		} else {
			throw error('No candidate branches for pub');
		}
	});
};
