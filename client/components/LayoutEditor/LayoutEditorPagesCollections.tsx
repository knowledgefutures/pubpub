import React, { useCallback, useMemo } from 'react';
import { Button, FormGroup } from '@blueprintjs/core';

import {
	InputField,
	Popover,
	OrderPicker,
	PubMenuItem,
	MenuSelect,
	MenuSelectItems,
} from 'components';
import LayoutPagesCollections, {
	Content,
	BlockItem,
	PageOrCollection,
} from 'components/Layout/LayoutPagesCollections';
import { CollectionsPagesJustifyType } from 'types/layout';

type Props = {
	onChange: (index: number, block: Content) => any;
	content: Content;
	layoutIndex: number;
	pages: PageOrCollection[];
	collections: PageOrCollection[];
};

type OrderableItem = BlockItem & {
	title: string;
};

const getOrderableItem = (item: PageOrCollection, type: OrderableItem['type']): OrderableItem => {
	return {
		type,
		id: item.id,
		title: item.title,
	};
};

const getBlockItem = (item: OrderableItem): BlockItem => {
	return {
		type: item.type,
		id: item.id,
	};
};

const getAllItems = (
	collections: PageOrCollection[],
	pages: PageOrCollection[],
): OrderableItem[] => {
	return [
		...collections.map((collection) => getOrderableItem(collection, 'collection')),
		...pages.map((page) => getOrderableItem(page, 'page')),
	].sort((a, b) => (a.title > b.title ? 1 : -1));
};

const justifiedContent: MenuSelectItems<CollectionsPagesJustifyType> = [
	{ value: 'center', label: 'Center' },
	{ value: 'space-between', label: 'Space Between' },
	{ value: 'space-around', label: 'Space Around' },
	{ value: 'left', label: 'Left' },
];

const LayoutEditorPagesCollections = (props: Props) => {
	const { layoutIndex, onChange, content, collections, pages } = props;

	const allItems = useMemo(() => getAllItems(collections, pages), [collections, pages]);
	const [selectedItems, availableItems] = useMemo(() => {
		return [
			content.items
				.map((ci) => allItems.find((item) => ci.id === item.id))
				.filter((x): x is OrderableItem => !!x),
			allItems.filter((item) => !content.items.some((ci) => ci.id === item.id)),
		];
	}, [content.items, allItems]);

	const setTitle = useCallback(
		(title: string) =>
			onChange(layoutIndex, {
				...content,
				title,
			}),
		[onChange, layoutIndex, content],
	);

	const setSelectedItems = useCallback(
		(items: OrderableItem[]) =>
			onChange(layoutIndex, {
				...content,
				items: items.map(getBlockItem),
			}),
		[onChange, layoutIndex, content],
	);

	const setJustify = useCallback(
		(justify: CollectionsPagesJustifyType) =>
			onChange(layoutIndex, {
				...content,
				justify,
			}),
		[onChange, layoutIndex, content],
	);

	return (
		<div className="layout-editor-pages-component">
			<div className="block-header">
				<InputField
					label="Title"
					value={content.title}
					onChange={(evt) => setTitle(evt.target.value)}
				/>

				<div className="dropdown-grouping">
					<div className="dropdown">
						<FormGroup label="Justify Content">
							<MenuSelect
								value={content.justify || 'space-between'}
								items={justifiedContent}
								onSelectValue={setJustify}
								aria-label="Choose Justify Content"
								buttonProps={{ fill: true }}
							/>
						</FormGroup>
					</div>

					<div className="dropdown">
						<FormGroup label="Collections & Pages">
							<Popover
								aria-label="Choose pinned Pubs for this block"
								className="order-picker-popover"
								placement="bottom-end"
								content={
									<OrderPicker
										availableItems={availableItems}
										selectedItems={selectedItems}
										onSelectedItems={setSelectedItems}
										renderItem={(item, handleClick) => (
											<PubMenuItem
												title={item.title}
												id={item.id}
												onClick={handleClick}
											/>
										)}
									/>
								}
							>
								<Button rightIcon="caret-down" outlined>
									Choose Items
									{selectedItems.length ? ` (${selectedItems.length})` : ''}
								</Button>
							</Popover>
						</FormGroup>
					</div>
				</div>
			</div>
			<LayoutPagesCollections content={content} pages={pages} collections={collections} />
		</div>
	);
};
export default LayoutEditorPagesCollections;
