import React, { useContext } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@blueprintjs/core';

import Icon from 'components/Icon/Icon';

import { CommunityNavigationEntry } from 'client/utils/navigation';

import { NavBuilderContext } from './navBuilderContext';
import NavBuilderRow from './NavBuilderRow';

type Props = {
	id: string;
	items?: CommunityNavigationEntry[];
	newLink: any;
};

const NavBuilderList = (props: Props) => {
	const { id, items = [], newLink } = props;
	const { removeItem } = useContext(NavBuilderContext);

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
								// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
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
												dropdownId={id}
												index={index}
												item={item}
												newLink={newLink}
												NavBuilderList={NavBuilderList}
											/>
											<Button
												icon="small-cross"
												minimal
												small
												onClick={() => removeItem(itemId, id)}
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

export default NavBuilderList;
