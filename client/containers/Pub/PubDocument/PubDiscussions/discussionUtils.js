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

export const groupDiscussionsByTop = (decorations) => {
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
				decoration.attrs.class.indexOf('discussion-range') > -1
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
		.forEach((topKey, index, array) => {
			const ids = discussionTops[topKey].map((discussion) => {
				return discussion.attrs.class.replace('discussion-range d-', '');
			});

			/* 70 comes from the rough max height of PubDiscussions/SidePreviews/Preview */
			const nextItemIsNear =
				index < array.length - 1 && Number(array[index + 1]) < Number(topKey) + 110;
			const isCollapsed = nextItemIsNear || ids.length > 1;
			groupings.push({
				key: Number(topKey) + window.scrollY,
				ids: ids,
				isCollapsed: isCollapsed,
			});
		});
	return groupings;
};

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
