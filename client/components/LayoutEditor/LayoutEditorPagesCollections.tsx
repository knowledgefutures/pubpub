import React, { useCallback, useMemo } from 'react';
import { Button, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';

import { InputField, OrderPicker } from 'components';
import LayoutPagesCollections, {
	Content,
	BlockItem,
	PageOrCollection,
	isLegacyContent,
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
		type: type,
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
	isLegacy: boolean,
	collections: PageOrCollection[],
	pages: PageOrCollection[],
): OrderableItem[] => {
	// TODO(ian): Remove this branch after migration
	if (isLegacy) {
		return pages.map((page) => getOrderableItem(page, 'page'));
	}
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
	// TODO(ian): Remove this branch after migration
	if (isLegacyContent(content)) {
		return content.pageIds
			.map((id) => allItems.find((item) => item.type === 'page' && item.id === id))
			.filter((item): item is OrderableItem => !!item);
	}
	return content.items.map((item) => ({ ...item, title: titleIndex[item.id] }));
};

const LayoutEditorPages = (props: Props) => {
	const { layoutIndex, onChange, content, collections, pages } = props;
	const isLegacy = isLegacyContent(content);
	const itemsLabel = isLegacy ? 'pages' : 'items';

	const allItems = useMemo(() => getAllItems(isLegacy, collections, pages), [
		isLegacy,
		collections,
		pages,
	]);
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
				title: title,
			}),
		[onChange, layoutIndex, content],
	);

	const setSelectedItems = useCallback(
		(items: OrderableItem[]) => {
			// TODO(ian): Remove this branch after migration
			if (isLegacy) {
				onChange(layoutIndex, {
					...content,
					pageIds: items.map((item) => item.id),
				});
			} else {
				onChange(layoutIndex, {
					...content,
					items: items.map(getBlockItem),
				});
			}
		},
		[onChange, layoutIndex, content, isLegacy],
	);

	return (
		<div className="layout-editor-pages-component">
			<div className="block-header">
				<InputField
					label="Title"
					value={content.title}
					onChange={(evt) => setTitle(evt.target.value)}
				/>
				<InputField label={isLegacy ? 'Pages' : 'Collections & Pages'}>
					<Popover
						content={
							<OrderPicker
								selectedItems={selectedItems}
								allItems={allItems}
								onChange={setSelectedItems}
								uniqueId={String(layoutIndex)}
								selectedTitle={`Displayed ${itemsLabel}`}
								availableTitle={`Available ${itemsLabel}`}
							/>
						}
						interactionKind={PopoverInteractionKind.CLICK}
						position={Position.BOTTOM_RIGHT}
						usePortal={false}
						minimal={true}
						popoverClassName="order-picker-popover"
					>
						<Button rightIcon="caret-down">Choose {itemsLabel}</Button>
					</Popover>
				</InputField>
			</div>
			<LayoutPagesCollections content={content} pages={pages} collections={collections} />
		</div>
	);
};
export default LayoutEditorPages;
