import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';

import DragDropListing, { Props as DragDropListingProps, MinimalItem } from './DragDropListing';

type Props<Item extends MinimalItem> = {
	onReorderItems: (reorderedItems: Item[]) => unknown;
	getReorderedItem?: (item: Item, listWithItemRemoved: Item[]) => Item;
} & Omit<DragDropListingProps<Item>, 'droppableId'>;

const DragDropOrdering = <Item extends MinimalItem>(props: Props<Item>) => {
	const { onReorderItems, getReorderedItem, ...dragDropListingProps } = props;

	const handleDragEnd = (result: DropResult) => {
		const { source, destination } = result;
		if (destination) {
			const { index: sourceIndex } = source;
			const { index: destinationIndex } = destination;
			const nextItems = [...props.items];
			const [removedItem] = nextItems.splice(sourceIndex, 1);
			const reorderedItem = getReorderedItem
				? getReorderedItem(removedItem, nextItems)
				: removedItem;
			nextItems.splice(destinationIndex, 0, reorderedItem);
			onReorderItems(nextItems);
		}
	};

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<DragDropListing {...dragDropListingProps} droppableId="drag-drop-ordering" />
		</DragDropContext>
	);
};

export default DragDropOrdering;
