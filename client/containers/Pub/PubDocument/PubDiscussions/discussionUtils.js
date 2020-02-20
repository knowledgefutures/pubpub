export const groupThreadsByLine = (decorations, threads) => {
	const sortedDecorations = decorations.sort((foo, bar) => {
		if (foo.boundingBox.bottom < bar.boundingBox.bottom) {
			return -1;
		}
		if (foo.boundingBox.bottom > bar.boundingBox.bottom) {
			return 1;
		}
		return 0;
	});
	let lastBottom;
	const discussionBottoms = {};
	sortedDecorations
		.filter((decoration) => {
			return (
				decoration.attrs &&
				decoration.attrs.class &&
				(decoration.attrs.class.indexOf('discussion-range') > -1 ||
					decoration.attrs.class.indexOf('local-highlight') > -1)
			);
		})
		.forEach((decoration) => {
			const currentBottom = decoration.boundingBox.bottom;
			if (lastBottom === currentBottom) {
				discussionBottoms[lastBottom].push(decoration);
				return null;
			}
			lastBottom = currentBottom;
			discussionBottoms[currentBottom] = [decoration];
			return null;
		});

	const groupings = [];
	Object.keys(discussionBottoms)
		.sort((foo, bar) => {
			if (Number(foo) < Number(bar)) {
				return -1;
			}
			if (Number(foo) > Number(bar)) {
				return 1;
			}
			return 0;
		})
		.forEach((bottomKey) => {
			const conatainedThreads = discussionBottoms[bottomKey]
				.sort((foo, bar) => {
					if (foo.boundingBox.left < bar.boundingBox.left) {
						return -1;
					}
					if (foo.boundingBox.left > bar.boundingBox.left) {
						return 1;
					}
					return 0;
				})
				.map((decoration) => {
					const isNewDiscussion = decoration.attrs.class.indexOf('local-highlight') > -1;
					if (isNewDiscussion) {
						const newDiscussionId = decoration.attrs.class.replace(
							'local-highlight lh-',
							'',
						);
						return [{ id: newDiscussionId }];
					}
					const id = decoration.attrs.class.replace('discussion-range d-', '');
					const decorationThread = threads.find((thread) => {
						return thread.id === id;
					});
					return decorationThread;
				})
				.filter((thread) => {
					return thread && !thread.isClosed;
				});

			/* Find the right-most id, and use that as the mount point */
			/* for a group, so we don't break in the middle of a line. */
			const mountDiscussion = discussionBottoms[bottomKey].reduce((prev, curr) => {
				if (!prev) {
					return curr;
				}
				if (curr.boundingBox.right > prev.boundingBox.right) {
					return curr;
				}
				return prev;
			}, undefined);

			const mountClassName =
				mountDiscussion.attrs.class.indexOf('discussion-range d-') > -1
					? mountDiscussion.attrs.class.replace('discussion-range d-', 'dm-')
					: mountDiscussion.attrs.class.replace('local-highlight lh-', 'lm-');

			groupings.push({
				key: bottomKey,
				mountClassName: mountClassName,
				threads: conatainedThreads,
			});
		});
	return groupings;
};

// export const nestDiscussionsToThreads = function(discussions) {
// 	return [];
// 	const maxThreadNumber = discussions.reduce((prev, curr) => {
// 		if (curr.threadNumber > prev) {
// 			return curr.threadNumber;
// 		}
// 		return prev;
// 	}, 0);

// 	const tempThreads = new Array(maxThreadNumber).fill([]);
// 	discussions.forEach((item) => {
// 		tempThreads[item.threadNumber - 1] = [...tempThreads[item.threadNumber - 1], item];
// 	});

// 	return tempThreads
// 		.filter((thread) => {
// 			return thread.length;
// 		})
// 		.map((thread) => {
// 			return thread.sort((foo, bar) => {
// 				if (foo.createdAt > bar.createdAt) {
// 					return 1;
// 				}
// 				if (foo.createdAt < bar.createdAt) {
// 					return -1;
// 				}
// 				return 0;
// 			});
// 		});
// };

export const discussionMatchesSearchTerm = (discussion, searchTerm) => {
	if (!searchTerm) {
		return false;
	}
	return [discussion.text, discussion.author.fullName]
		.map((x) => x.toLowerCase())
		.some((entry) => entry.toLowerCase().includes(searchTerm.toLowerCase()));
};

export const filterAndSortThreads = (
	threads,
	isArchivedList,
	sortMode,
	filteredLabels,
	activeBranchId,
	searchTerm = null,
	showAnchoredDiscussions = true,
) => {
	return (
		threads
			.filter((thread) => {
				// const threadIsArchived = items.reduce((prev, curr) => {
				// 	if (curr.isClosed) {
				// 		return true;
				// 	}
				// 	return prev;
				// }, false);
				return isArchivedList ? thread.isClosed : !thread.isClosed;
			})
			// .filter((items) => {
			// 	return items[0].branchId === activeBranchId;
			// })
			.filter((thread) => {
				if (!searchTerm) {
					return true;
				}
				return thread.comments.some((discussion) =>
					discussionMatchesSearchTerm(discussion, searchTerm),
				);
			})
			.filter((thread) => {
				// if (showAnchoredDiscussions) {
				// 	return true;
				// }
				// return (
				// 	items[0] &&
				// 	(items[0].highlights === null ||
				// 		(Array.isArray(items[0].highlights) && items[0].highlights.length === 0))
				// );
				return !thread.threadAnchor || showAnchoredDiscussions;
			})
			.filter((thread) => {
				// const threadLabels = items.reduce((prev, curr) => {
				// 	if (curr.labels && curr.labels.length) {
				// 		return curr.labels;
				// 	}
				// 	return prev;
				// }, []);
				if (filteredLabels.length === 0) {
					return true;
				}
				const hasNecessaryLabel = filteredLabels.reduce((prev, curr) => {
					if (thread.labels.indexOf(curr) === -1) {
						return false;
					}
					return prev;
				}, true);
				return hasNecessaryLabel;
			})
			.sort((foo, bar) => {
				/* Newest Thread */
				if (sortMode === 'newestThread' && foo.number > bar.number) {
					return -1;
				}
				if (sortMode === 'newestThread' && foo.number < bar.number) {
					return 1;
				}
				/* Oldest Thread */
				if (sortMode === 'oldestThread' && foo.number < bar.number) {
					return -1;
				}
				if (sortMode === 'oldestThread' && foo.number > bar.number) {
					return 1;
				}
				/* Newest Reply */
				const fooNewestReply = foo.comments.reduce((prev, curr) => {
					if (curr.createdAt > prev) {
						return curr.createdAt;
					}
					return prev;
				}, '0000-02-01T22:21:19.608Z');
				const barNewestReply = bar.comments.reduce((prev, curr) => {
					if (curr.createdAt > prev) {
						return curr.createdAt;
					}
					return prev;
				}, '0000-02-01T22:21:19.608Z');
				if (sortMode === 'newestReply' && fooNewestReply > barNewestReply) {
					return -1;
				}
				if (sortMode === 'newestReply' && fooNewestReply < barNewestReply) {
					return 1;
				}
				/* Oldest Reply */
				const fooOldestReply = foo.comments.reduce((prev, curr) => {
					if (curr.createdAt < prev) {
						return curr.createdAt;
					}
					return prev;
				}, '9999-02-01T22:21:19.608Z');
				const barOldestReply = bar.comments.reduce((prev, curr) => {
					if (curr.createdAt < prev) {
						return curr.createdAt;
					}
					return prev;
				}, '9999-02-01T22:21:19.608Z');
				if (sortMode === 'oldestReply' && fooOldestReply < barOldestReply) {
					return -1;
				}
				if (sortMode === 'oldestReply' && fooOldestReply > barOldestReply) {
					return 1;
				}
				/* Most Replies */
				if (
					sortMode === 'mostReplies' &&
					foo.comments.length > bar.comments.length
				) {
					return -1;
				}
				if (
					sortMode === 'mostReplies' &&
					foo.comments.length < bar.comments.length
				) {
					return 1;
				}
				/* Least Replies */
				if (
					sortMode === 'leastReplies' &&
					foo.comments.length < bar.comments.length
				) {
					return -1;
				}
				if (
					sortMode === 'leastReplies' &&
					foo.comments.length > bar.comments.length
				) {
					return 1;
				}
				return 0;
			})
	);
};
