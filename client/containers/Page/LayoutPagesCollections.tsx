import React from 'react';
import PagePreview from 'components/PagePreview/PagePreview';

export type BlockItem = {
	type: 'page' | 'collection';
	id: string;
};

export type PageOrCollection = {
	title: string;
	id: string;
	slug: string;
};

type LegacyContent = {
	title: string;
	pageIds: string[];
};

type CollectionsPagesContent = {
	title: string;
	items: BlockItem[];
};

export type Content = LegacyContent | CollectionsPagesContent;
export const isLegacyContent = (c: Content): c is LegacyContent => 'pageIds' in c;

type Props = {
	content: Content;
	pages: PageOrCollection[];
	collections: PageOrCollection[];
};

const resolveItemsFromContent = (
	content: Content,
	collections: PageOrCollection[],
	pages: PageOrCollection[],
): PageOrCollection[] => {
	if (isLegacyContent(content)) {
		return content.pageIds
			.map((pageId) => pages.find((p) => p.id === pageId))
			.filter((page): page is PageOrCollection => !!page);
	}
	return content.items
		.map((item) => {
			const items = item.type === 'collection' ? collections : pages;
			return items.find((it) => it.id === item.id);
		})
		.filter((item): item is PageOrCollection => !!item);
};

const LayoutPages = (props: Props) => {
	const { content, collections, pages } = props;
	return (
		<div className="block-content">
			<div className="container">
				{props.content.title && (
					<div className="row">
						<div className="col-12">
							<h1>{props.content.title}</h1>
						</div>
					</div>
				)}
				<div className="row">
					<div className="col-12">
						<div className="pages-wrapper">
							{resolveItemsFromContent(content, collections, pages).map((item) => (
								<PagePreview key={item.id} pageData={item} />
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LayoutPages;
