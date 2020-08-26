import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';
import NavBuilderRow from './NavBuilderRow';

type OwnProps = {
	id: string;
	items?: any[];
	removeItem: (...args: any[]) => any;
	updateItem: (...args: any[]) => any;
	pages: any[];
	newLink: any;
};

const defaultProps = {
	items: [],
};

type Props = OwnProps & typeof defaultProps;

const NavBuilderList = (props: Props) => {
	const { id, items, updateItem, pages, newLink, removeItem } = props;

	return (
		<Droppable droppableId={id} type={id}>
			{(provided, snapshot) => (
				<div
					ref={provided.innerRef}
					className={snapshot.isDraggingOver ? 'dragging' : ''}
					{...provided.droppableProps}
				>
					{items.map((item, index) => {
						const itemId = typeof item === 'string' ? item : item.id;
						return (
							<Draggable
								key={`draggable-${itemId}-${id}`}
								draggableId={`draggable-${itemId}-${id}`}
								index={index}
								type={id}
							>
								{(providedItem, snapshotItem) => (
									<div
										ref={providedItem.innerRef}
										className={
											snapshotItem.isDragging
												? 'dragging nav-builder-row'
												: 'nav-builder-row'
										}
										{...providedItem.draggableProps}
									>
										<div className="shadow">
											<span {...providedItem.dragHandleProps}>
												<Icon
													className="drag-handle"
													icon="drag-handle-horizontal"
												/>
											</span>
											<NavBuilderRow
												// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'undefined... Remove this comment to see the full error message
												dropdownId={id}
												// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type 'undefined... Remove this comment to see the full error message
												index={index}
												item={item}
												removeItem={removeItem}
												updateItem={updateItem}
												pages={pages}
												newLink={newLink}
												// @ts-expect-error ts-migrate(2322) FIXME: Type '{ (props: Props): JSX.Element; defaultProps:... Remove this comment to see the full error message
												NavBuilderList={NavBuilderList}
											/>
											<Button
												icon="small-cross"
												minimal
												small
												onClick={() => {
													removeItem(itemId, id);
												}}
											/>
										</div>
									</div>
								)}
							</Draggable>
						);
					})}
					{provided.placeholder}
				</div>
			)}
		</Droppable>
	);
};
NavBuilderList.defaultProps = defaultProps;
export default NavBuilderList;
