import React from 'react';

import { LayoutBlockCollectionsPages } from 'types/layout';
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

export type Content = LayoutBlockCollectionsPages['content'];

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
	return content.items
		.map((item) => {
			const items = 'type' in item && item.type === 'collection' ? collections : pages;
			return items.find((it) => it.id === item.id);
		})
		.filter((item): item is PageOrCollection => !!item);
};

const LayoutPagesCollections = (props: Props) => {
	const { content, collections, pages } = props;
	const gridTemplateColumnsCssFill = content.justify === 'center' ? 'auto-fit' : 'auto-fill';
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
						<div
							className="pages-wrapper"
							style={
								content.justify
									? {
											justifyContent: content.justify,
											gridTemplateColumns: `repeat(${gridTemplateColumnsCssFill}, 175px)`,
									  }
									: {}
							}
						>
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

export default LayoutPagesCollections;
