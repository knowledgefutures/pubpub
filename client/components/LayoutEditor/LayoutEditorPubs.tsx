import React, { useCallback, useMemo } from 'react';
import { Button, Checkbox, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';

import { CollectionMultiSelect, InputField, OrderPicker } from 'components';
import { LayoutPubs } from 'components/Layout';
import { Community, Pub, Collection } from 'utils/types';
import { indexByProperty } from 'utils/arrays';
import { LayoutBlockPubs, PubPreviewType, PubSortOrder } from 'utils/layout/types';

type Content = LayoutBlockPubs['content'];

type Props = {
	onChange: (index: number, content: Partial<Content>) => any;
	layoutIndex: number;
	block: LayoutBlockPubs;
	allPubs: Pub[];
	pubsInBlock: Pub[];
	hideOrderControl: boolean;
	communityData: Community & { collections: Collection[] };
};

const limitPubsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const pubIsInCollections = (pub: Pub, collectionIds: string[]) => {
	if (collectionIds.length === 0) {
		return true;
	}
	return (
		pub.collectionPubs &&
		pub.collectionPubs.some((collectionPub) =>
			collectionIds.some((collectionId) => collectionId === collectionPub.collectionId),
		)
	);
};

const LayoutEditorPubs = (props: Props) => {
	const {
		onChange: fullOnChange,
		layoutIndex,
		block,
		allPubs,
		pubsInBlock,
		communityData,
		hideOrderControl,
	} = props;
	const {
		limit,
		pubIds = [],
		collectionIds = [],
		pubPreviewType,
		hideByline,
		hideContributors,
		hideDates,
		hideDescription,
		hideEdges,
		sort = 'legacy',
	} = block.content;

	const availablePubs = useMemo(() => {
		return allPubs.filter((pub) => pubIsInCollections(pub, collectionIds));
	}, [allPubs, collectionIds]);

	const pubsById = useMemo(() => indexByProperty(allPubs, 'id'), [allPubs]);

	const onChange = useCallback((update: Partial<Content>) => fullOnChange(layoutIndex, update), [
		fullOnChange,
		layoutIndex,
	]);

	const setPreviewType = useCallback(
		(type: PubPreviewType) =>
			onChange({
				pubPreviewType: type,
			}),
		[onChange],
	);

	const setLimit = useCallback(
		(nextLimit: number) =>
			onChange({
				limit: nextLimit,
			}),
		[onChange],
	);

	const setSort = useCallback(
		(nextSort: PubSortOrder) =>
			onChange({
				sort: nextSort,
			}),
		[onChange],
	);

	const setHideByline = useCallback(
		(nextHideByline: boolean) =>
			onChange({
				hideByline: nextHideByline,
			}),
		[onChange],
	);

	const setHideDescription = useCallback(
		(nextHideDescriptions: boolean) =>
			onChange({
				hideDescription: nextHideDescriptions,
			}),
		[onChange],
	);

	const setHideDates = useCallback(
		(nextHideDates: boolean) =>
			onChange({
				hideDates: nextHideDates,
			}),
		[onChange],
	);

	const setHideContributors = useCallback(
		(nextHideContributors: boolean) =>
			onChange({
				hideContributors: nextHideContributors,
			}),
		[onChange],
	);

	const setHideEdges = useCallback(
		(nextHideEdges: boolean) =>
			onChange({
				hideEdges: nextHideEdges,
			}),
		[onChange],
	);

	const setCollectionIds = useCallback(
		(nextCollectionIds: string[]) => {
			const validPubIds = (pubIds || [])
				.map((pubId) => pubsById[pubId])
				.filter((pub) => pub && pubIsInCollections(pub, nextCollectionIds))
				.map((pub) => pub.id);
			onChange({
				collectionIds: nextCollectionIds,
				pubIds: validPubIds,
			});
		},
		[onChange, pubIds, pubsById],
	);

	const setPubIds = useCallback(
		(pubs: Pub[]) => onChange({ pubIds: pubs.map((pub) => pub.id) }),
		[onChange],
	);

	const setTitle = useCallback((title: string) => onChange({ title }), [onChange]);

	const renderTitle = () => {
		return (
			<InputField
				label="Title"
				value={block.content.title}
				onChange={(evt) => setTitle(evt.target.value)}
			/>
		);
	};

	const renderCollectionFilter = () => {
		const { collections } = communityData;
		return (
			<InputField label="Filter by Collection">
				<CollectionMultiSelect
					allCollections={collections}
					selectedCollectionIds={collectionIds}
					onItemSelect={(newCollectionId) =>
						setCollectionIds([...collectionIds, newCollectionId])
					}
					onRemove={(_, collectionIndex) => {
						const nextCollectionIds = [...collectionIds];
						nextCollectionIds.splice(collectionIndex, 1);
						setCollectionIds(nextCollectionIds);
					}}
					placeholder="Add collections..."
				/>
			</InputField>
		);
	};

	const renderLimit = () => {
		return (
			<InputField label="Limit">
				<div className="bp3-button-group bp3-select">
					<select
						value={limit}
						onChange={(evt) => setLimit(parseInt(evt.target.value, 10))}
					>
						<option value={0}>Show All pubs</option>
						{limitPubsOptions.map((item) => {
							return (
								<option value={item} key={`option-${item}`}>
									Show {item} pub{item === 1 ? '' : 's'}
								</option>
							);
						})}
					</select>
				</div>
			</InputField>
		);
	};

	const renderOrder = () => {
		if (hideOrderControl) {
			return null;
		}
		return (
			<InputField label="Order">
				<div className="bp3-button-group bp3-select">
					<select
						value={sort}
						onChange={(evt) => setSort(evt.target.value as PubSortOrder)}
					>
						<option value="publish-date-reversed">First published</option>
						<option value="publish-date">Recently published</option>
						<option value="creation-date-reversed">First created</option>
						<option value="creation-date">Recently created</option>
						<option value="collection-rank">Collection order</option>
						<option value="legacy" disabled>
							Legacy
						</option>
					</select>
				</div>
			</InputField>
		);
	};

	const renderPinnedPubs = () => {
		return (
			<InputField label="Pinned Pubs">
				<Popover
					content={
						<OrderPicker
							selectedItems={(pubIds || [])
								.map((pubId) => pubsById[pubId])
								.filter((x) => x)}
							allItems={availablePubs}
							onChange={setPubIds}
							uniqueId={String(layoutIndex)}
							selectedTitle="Pinned Pubs"
							availableTitle="Available Pubs"
							selectedTitleTooltip="Pinned pubs will be displayed first, followed by newest pubs."
						/>
					}
					interactionKind={PopoverInteractionKind.CLICK}
					position={Position.BOTTOM_RIGHT}
					usePortal={false}
					minimal={true}
					popoverClassName="order-picker-popover"
				>
					<Button rightIcon="caret-down">Pin to top</Button>
				</Popover>
			</InputField>
		);
	};

	const renderPreviewType = () => {
		return (
			<InputField label="Preview Type">
				<div className="bp3-button-group">
					<Button
						active={pubPreviewType === 'large'}
						onClick={() => setPreviewType('large')}
						text="Large"
					/>
					<Button
						active={pubPreviewType === 'medium'}
						onClick={() => setPreviewType('medium')}
						text="Medium"
					/>
					<Button
						active={pubPreviewType === 'small'}
						onClick={() => setPreviewType('small')}
						text="Small"
					/>
					<Button
						active={pubPreviewType === 'minimal'}
						onClick={() => setPreviewType('minimal')}
						text="Minimal"
					/>
				</div>
			</InputField>
		);
	};

	const renderPreviewElements = () => {
		return (
			<InputField label="Preview Elements">
				<Checkbox
					checked={!hideByline}
					onChange={() => setHideByline(!hideByline)}
					label="Byline"
				/>
				<Checkbox
					checked={pubPreviewType === 'minimal' ? false : !hideDescription}
					onChange={() => setHideDescription(!hideDescription)}
					disabled={pubPreviewType === 'minimal'}
					label="Description"
				/>
				<Checkbox
					checked={pubPreviewType === 'minimal' ? false : !hideDates}
					onChange={() => setHideDates(!hideDates)}
					disabled={pubPreviewType === 'minimal'}
					label="Dates"
				/>
				<Checkbox
					checked={pubPreviewType === 'minimal' ? false : !hideContributors}
					onChange={() => setHideContributors(!hideContributors)}
					disabled={pubPreviewType === 'minimal'}
					label="Contributors"
				/>
				<Checkbox
					checked={!hideEdges}
					onChange={() => setHideEdges(!hideEdges)}
					label="Connections"
				/>
			</InputField>
		);
	};

	return (
		<div className="layout-editor-pubs-component">
			<div className="block-header">
				{renderTitle()}
				{renderCollectionFilter()}
				{renderLimit()}
				{renderOrder()}
				{renderPinnedPubs()}
				<div className="line-break" />
				{renderPreviewType()}
				{renderPreviewElements()}
			</div>
			<LayoutPubs pubs={pubsInBlock} content={block.content} />
		</div>
	);
};
export default LayoutEditorPubs;
