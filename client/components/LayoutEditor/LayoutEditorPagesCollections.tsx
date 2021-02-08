import React, { useCallback, useMemo } from 'react';
import { Button, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';

import { InputField, OrderPicker } from 'components';
import LayoutPagesCollections, {
	Content,
	BlockItem,
	PageOrCollection,
} from 'components/Layout/LayoutPagesCollections';

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

const indexItemTitlesById = (allItems: OrderableItem[]): Record<string, string> => {
	const res = {};
	allItems.forEach((item) => {
		res[item.id] = item.title;
	});
	return res;
};

const getSelectedItems = (
	content: Content,
	allItems: OrderableItem[],
	titleIndex: Record<string, string>,
): OrderableItem[] => {
	return content.items.map((item) => ({ ...item, title: titleIndex[item.id] }));
};

const LayoutEditorPages = (props: Props) => {
	const { layoutIndex, onChange, content, collections, pages } = props;

	const allItems = useMemo(() => getAllItems(collections, pages), [collections, pages]);
	const titleIndex = useMemo(() => indexItemTitlesById(allItems), [allItems]);
	const selectedItems = useMemo(() => getSelectedItems(content, allItems, titleIndex), [
		content,
		allItems,
		titleIndex,
	]);

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

	return (
		<div className="layout-editor-pages-component">
			<div className="block-header">
				<InputField
					label="Title"
					value={content.title}
					onChange={(evt) => setTitle(evt.target.value)}
				/>
				<InputField label="Collections & Pages">
					<Popover
						content={
							<OrderPicker
								selectedItems={selectedItems}
								allItems={allItems}
								onChange={setSelectedItems}
								uniqueId={String(layoutIndex)}
								selectedTitle="Displayed items"
								availableTitle="Available items"
							/>
						}
						interactionKind={PopoverInteractionKind.CLICK}
						position={Position.BOTTOM_RIGHT}
						usePortal={false}
						minimal={true}
						popoverClassName="order-picker-popover"
					>
						<Button rightIcon="caret-down">Choose items</Button>
					</Popover>
				</InputField>
			</div>
			<LayoutPagesCollections content={content} pages={pages} collections={collections} />
		</div>
	);
};
export default LayoutEditorPages;
