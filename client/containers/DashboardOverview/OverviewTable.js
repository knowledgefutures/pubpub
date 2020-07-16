import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InputGroup, NonIdealState } from '@blueprintjs/core';
import { DragDropContext } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { DragDropListing } from 'components';
import { usePageContext } from 'utils/hooks';
import { useSticky } from 'client/utils/useSticky';

import { fuzzyMatchCollection, fuzzyMatchPub } from 'utils/fuzzyMatch';
import OverviewRow from './OverviewRow';

require('./overviewTable.scss');

const propTypes = {
	title: PropTypes.string.isRequired,
	collectionList: PropTypes.array,
	pubList: PropTypes.array.isRequired,
	onReorder: PropTypes.func,
	generateLabel: PropTypes.func,
	rowControls: PropTypes.func,
	emptyState: PropTypes.node.isRequired,
};

const defaultProps = {
	collectionList: [],
	generateLabel: () => {},
	onReorder: undefined,
	rowControls: () => {},
};

const handleDragDrop = ({ dragResult, reorderCollectionPubs }) => {
	const { source, destination } = dragResult;
	reorderCollectionPubs(source.index, destination.index);
};

const OverviewTable = (props) => {
	const {
		title,
		collectionList,
		pubList,
		onReorder,
		generateLabel,
		rowControls,
		emptyState,
	} = props;
	const [filterText, setFilterText] = useState('');
	const { scopeData } = usePageContext();
	const { activeCollection } = scopeData.elements;
	const filterCollections = () => {
		return collectionList
			.map((cl) => {
				if (fuzzyMatchCollection(cl, filterText)) {
					return cl;
				}
				const filteredPubs = cl.pubs.filter((pub) => fuzzyMatchPub(pub, filterText));
				if (filteredPubs.length) {
					return { ...cl, pubs: filteredPubs };
				}
				return null;
			})
			.filter((coll) => !!coll);
	};

	const filterPubs = () => {
		return pubList.filter((item) => fuzzyMatchPub(item, filterText));
	};

	const filteredItems = [...filterCollections(), ...filterPubs()];
	useSticky({
		selector: '.top-sticky',
		offset: 141,
	});
	return (
		<div className="overview-table-component">
			<div className="table-title">{title}</div>

			<div className={classNames({ list: true, 'collection-list': onReorder })}>
				<div className="top-sticky">
					<InputGroup
						className="filter-input"
						fill
						large
						leftIcon="search"
						placeholder={`Filter ${title}`}
						value={filterText}
						onChange={(evt) => {
							setFilterText(evt.target.value);
						}}
					/>
					<div className="list-header overview-row-component">
						<span className="handle" />
						<span className="type">Type</span>
						<span className="title">Title</span>
						<span className="pubs">Pubs</span>
						<span className="released">Released</span>
						<span className="discussions">Discussions</span>
						<span className="reviews">Reviews</span>
						<span className="pub-options" />
					</div>
				</div>
				<DragDropContext
					onDragEnd={(dragResult) =>
						handleDragDrop({
							dragResult: dragResult,
							reorderCollectionPubs: onReorder,
						})
					}
				>
					<DragDropListing
						disabled={!onReorder}
						itemId={(item) => item.pubId || item.id}
						items={filteredItems}
						renderItem={(item, dragHandleProps, isDragging) => {
							return (
								<OverviewRow
									label={generateLabel(item)}
									content={item.pub || item}
									dragHandleProps={onReorder ? dragHandleProps : null}
									isDragging={isDragging}
									controls={rowControls(item)}
									parentSlug={
										activeCollection ? activeCollection.slug : undefined
									}
								>
									{item.pubs &&
										item.pubs.map((pub) => {
											const slug =
												item.slug ||
												item.title.toLowerCase().replace(/ /gi, '-');
											return (
												<OverviewRow
													key={`${item.id}-${pub.id}`}
													content={pub}
													parentSlug={slug}
												/>
											);
										})}
								</OverviewRow>
							);
						}}
						renderEmptyState={() => {
							if (pubList.length > 0) {
								return (
									<NonIdealState
										icon="search"
										title="No matching Pubs to show."
									/>
								);
							}
							return emptyState;
						}}
						droppableId="collectionsListing"
						droppableType="COLLECTION_PUB"
						withDragHandles={!!onReorder}
					/>
				</DragDropContext>
			</div>
		</div>
	);
};

OverviewTable.propTypes = propTypes;
OverviewTable.defaultProps = defaultProps;
export default OverviewTable;
