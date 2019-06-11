export const getDiscussionIdArray = (decorations) => {
	return decorations
		.filter((decoration) => {
			const attrs = decoration.attrs || {};
			const className = attrs.class || '';
			return className.indexOf('discussion-range d-') > -1;
		})
		.map((decoration) => {
			const attrs = decoration.attrs || {};
			const className = attrs.class || '';
			const id = className.replace('discussion-range d-', '');
			return id;
		});
};

export const getNewDiscussionIdArray = (decorations) => {
	return decorations
		.filter((decoration) => {
			const attrs = decoration.attrs || {};
			const className = attrs.class || '';
			return className.indexOf('local-highlight lh-') > -1;
		})
		.map((decoration) => {
			const attrs = decoration.attrs || {};
			const className = attrs.class || '';
			const id = className.replace('local-highlight lh-', '');
			return id;
		});
};

export const groupThreadsByTop = (decorations, threads) => {
	const sortedDecorations = decorations.sort((foo, bar) => {
		if (foo.boundingBox.top < bar.boundingBox.top) {
			return -1;
		}
		if (foo.boundingBox.top > bar.boundingBox.top) {
			return 1;
		}
		return 0;
	});
	let lastTop;
	const discussionTops = {};
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
			const currentTop = decoration.boundingBox.top;
			if (lastTop === currentTop) {
				discussionTops[lastTop].push(decoration);
				return null;
			}
			lastTop = currentTop;
			discussionTops[currentTop] = [decoration];
			return null;
		});

	const groupings = [];
	Object.keys(discussionTops)
		.sort((foo, bar) => {
			if (Number(foo) < Number(bar)) {
				return -1;
			}
			if (Number(foo) > Number(bar)) {
				return 1;
			}
			return 0;
		})
		.forEach((topKey) => {
			const conatainedThreads = discussionTops[topKey]
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
					const newDiscussionId = decoration.attrs.class.replace(
						'local-highlight lh-',
						'',
					);
					const id = decoration.attrs.class.replace('discussion-range d-', '');
					const decorationThread = threads.find((thread) => {
						return thread[0].id === id;
					});
					const newThread = [{ id: newDiscussionId }];
					return decorationThread || newThread;
				});

			/* Find the right-most id, and use that as the mount point */
			/* for a group, so we don't break in the middle of a line. */
			const mountDiscussion = discussionTops[topKey].reduce((prev, curr) => {
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
				key: Number(topKey) + window.scrollY,
				mountClassName: mountClassName,
				threads: conatainedThreads,
			});
		});
	return groupings;
};

// export const groupDiscussionsByTop = (decorations) => {
// 	const sortedDecorations = decorations.sort((foo, bar) => {
// 		if (foo.boundingBox.top < bar.boundingBox.top) {
// 			return -1;
// 		}
// 		if (foo.boundingBox.top > bar.boundingBox.top) {
// 			return 1;
// 		}
// 		return 0;
// 	});
// 	let lastTop;
// 	const discussionTops = {};
// 	sortedDecorations
// 		.filter((decoration) => {
// 			return (
// 				decoration.attrs &&
// 				decoration.attrs.class &&
// 				(decoration.attrs.class.indexOf('discussion-range') > -1 ||
// 					decoration.attrs.class.indexOf('local-highlight'))
// 			);
// 		})
// 		.forEach((decoration) => {
// 			const currentTop = decoration.boundingBox.top;
// 			if (lastTop === currentTop) {
// 				discussionTops[lastTop].push(decoration);
// 				return null;
// 			}
// 			lastTop = currentTop;
// 			discussionTops[currentTop] = [decoration];
// 			return null;
// 		});

// 	const groupings = [];
// 	Object.keys(discussionTops)
// 		.sort((foo, bar) => {
// 			if (Number(foo) < Number(bar)) {
// 				return -1;
// 			}
// 			if (Number(foo) > Number(bar)) {
// 				return 1;
// 			}
// 			return 0;
// 		})
// 		.forEach((topKey, index, array) => {
// 			const ids = discussionTops[topKey].map((discussion) => {
// 				return discussion.attrs.class.replace('discussion-range d-', '');
// 			});

// 			/* Find the right-most id, and use that as the mount point */
// 			/* for a group, so we don't break in the middle of a line. */
// 			const mountDiscussion = discussionTops[topKey].reduce((prev, curr) => {
// 				if (!prev) {
// 					return curr;
// 				}
// 				if (curr.boundingBox.right > prev.boundingBox.right) {
// 					return curr;
// 				}
// 				return prev;
// 			}, undefined);
// 			const mountId = mountDiscussion.attrs.class.replace('discussion-range d-', '');

// 			/* You want to calculate all the discussions that are on the same line - and then look to see if there is */
// 			/* a discussion one within N-pixels. If there are multipe - collapse. If there is one within N, collapse */
// 			/* If there is only one, and none within N - show full. */
// 			/* N=110 comes from the rough max height of PubDiscussions/SidePreviews/Preview */
// 			const nextItemIsNear =
// 				index < array.length - 1 && Number(array[index + 1]) < Number(topKey) + 110;
// 			const isCollapsed = nextItemIsNear || ids.length > 1;
// 			groupings.push({
// 				key: Number(topKey) + window.scrollY,
// 				mountId: mountId,
// 				ids: ids,
// 				isCollapsed: isCollapsed,
// 			});
// 		});
// 	return groupings;
// };

export const nestDiscussionsToThreads = function(discussions) {
	const maxThreadNumber = discussions.reduce((prev, curr) => {
		if (curr.threadNumber > prev) {
			return curr.threadNumber;
		}
		return prev;
	}, 0);

	const tempThreads = new Array(maxThreadNumber).fill([]);
	discussions.forEach((item) => {
		tempThreads[item.threadNumber - 1] = [...tempThreads[item.threadNumber - 1], item];
	});

	return tempThreads
		.filter((thread) => {
			return thread.length;
		})
		.map((thread) => {
			return thread.sort((foo, bar) => {
				if (foo.createdAt > bar.createdAt) {
					return 1;
				}
				if (foo.createdAt < bar.createdAt) {
					return -1;
				}
				return 0;
			});
		});
};
