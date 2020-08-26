import React from 'react';

export const generateHeaderBreadcrumbs = (pubData, locationData) => {
	const { mode, slug } = pubData;
	const sections = {
		merge: [{ text: 'Merge' }],
		reviewCreate: [{ text: 'New Review' }],
		reviews: [{ text: 'Reviews' }],
		review: [
			{ text: 'Reviews', href: `/pub/${slug}/reviews` },
			{ text: locationData.params.reviewShortId },
		],
		manage: [{ text: 'Manage' }],
		branchCreate: [{ text: 'New Branch' }],
	};
	const sectionData = sections[mode];
	if (!sectionData) {
		return null;
	}
	return sectionData.map((data) => {
		return (
			<span key={data.text} className="breadcrumb">
				{data.href ? (
					<a key={data.text} href={data.href}>
						{data.text}
					</a>
				) : (
					data.text
				)}
			</span>
		);
	});
};

// The "formatted download" is the file that the pub manager can upload themselves to represent the
// pub. It's stored in pub.downloads, but it's treated as a kind of special case.
export const getFormattedDownload = (downloads) => {
	if (!downloads) {
		return null;
	}
	return downloads.reduce((prev, curr) => {
		const currIsNewer = !prev || !prev.createdAt || curr.createdAt > prev.createdAt;
		if (curr.type === 'formatted' && currIsNewer) {
			return curr;
		}
		return prev;
	}, null);
};

// Finds a download for the given branchId and formatType
export const getExistingDownload = (downloads, branchId, formatType) => {
	return downloads.find((download) => {
		const sameBranch = download.branchId === branchId;
		const sameType = download.type === formatType.format;
		return sameType && sameBranch;
	});
};

export const getTocHeadings = (docJson) => {
	return docJson.content
		.filter((item) => {
			return item.type === 'heading' && item.attrs.level < 3;
		})
		.map((item, index) => {
			const textContent =
				item.content &&
				item.content
					.filter((node) => {
						/* Filter to remove inline non-text nodes: e.g. equations */
						return node.type === 'text';
					})
					.reduce((prev, curr) => {
						return `${prev}${curr.text}`;
					}, '');
			return {
				title: textContent,
				level: item.attrs.level,
				href: item.attrs.fixedId || item.attrs.id,
				index: index,
			};
		})
		.filter((item) => {
			/* Filter out empty headers */
			return item.title;
		});
};
