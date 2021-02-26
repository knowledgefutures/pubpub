import React, { useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { Button, Popover, Position } from '@blueprintjs/core';

import { CollectionMultiSelect, InputField, OrderPicker } from 'components';
import { LayoutPubs } from 'components/Layout';
import { MenuSelect, MenuSelectItems } from 'components/Menu';
import { Community, Pub, Collection } from 'utils/types';
import { indexByProperty } from 'utils/arrays';
import { LayoutBlockPubs, PubPreviewType, PubSortOrder } from 'utils/layout/types';

import PreviewElements from './PreviewElements';
import LimitPubs from './LimitPubs';

type Content = LayoutBlockPubs['content'];

type Props = {
	onChange: (index: number, content: Partial<Content>) => any;
	layoutIndex: number;
	loading?: boolean;
	block: LayoutBlockPubs;
	allPubs: Pub[];
	pubsInBlock: Pub[];
	communityData: Community & { collections: Collection[] };
};

const previewTypes: MenuSelectItems<PubPreviewType> = [
	{ value: 'large', label: 'Large' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'small', label: 'Small' },
	{ value: 'minimal', label: 'Minimal' },
];

const pubSortOrders: MenuSelectItems<PubSortOrder> = [
	{ value: 'publish-date-reversed', label: 'First published' },
	{ value: 'publish-date', label: 'Recently published' },
	{ value: 'creation-date-reversed', label: 'First created' },
	{ value: 'creation-date', label: 'Recently created' },
	{ value: 'collection-rank', label: 'Collection order' },
];

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
		loading,
	} = props;
	const {
		limit,
		pubIds = [],
		collectionIds = [],
		pubPreviewType,
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
		(nextLimit: undefined | number) =>
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
			<Popover
				content={<LimitPubs limit={block.content.limit} onChangeLimit={setLimit} />}
				position={Position.BOTTOM_LEFT}
				usePortal={false}
				minimal
			>
				<Button outlined icon="dashboard" rightIcon="caret-down">
					Limit Pubs
					{limit ? ` (${limit})` : ''}
				</Button>
			</Popover>
		);
	};

	const renderOrder = () => {
		return (
			<MenuSelect<PubSortOrder>
				aria-label="Select sort order"
				items={pubSortOrders}
				onSelectValue={(value) => setSort(value)}
				value={sort}
				defaultLabel={<i>Choose</i>}
				icon="sort"
				prefix={<b>Sort: </b>}
			/>
		);
	};

	const renderPinnedPubs = () => {
		return (
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
				position={Position.BOTTOM_RIGHT}
				usePortal={false}
				minimal
				popoverClassName="order-picker-popover"
			>
				<Button outlined icon="pin" rightIcon="caret-down">
					Pinned Pubs
					{pubIds.length ? ` (${pubIds.length})` : ''}
				</Button>
			</Popover>
		);
	};

	const renderPreviewType = () => {
		return (
			<MenuSelect<PubPreviewType>
				aria-label="Select preview type"
				items={previewTypes}
				value={pubPreviewType}
				onSelectValue={(value) => setPreviewType(value)}
				icon="control"
				prefix={<b>Size: </b>}
			/>
		);
	};

	const renderPreviewElements = () => {
		return (
			<Popover
				minimal
				position={Position.BOTTOM_LEFT}
				content={<PreviewElements content={block.content} onChangeContent={onChange} />}
				usePortal={false}
			>
				<Button outlined icon="settings" rightIcon="caret-down">
					Pub elements
				</Button>
			</Popover>
		);
	};

	return (
		<div className={classNames('layout-editor-pubs-component', loading && 'loading')}>
			<div className="block-header rows">
				<div className="controls-row">
					{renderTitle()}
					{renderCollectionFilter()}
				</div>
				<div className="controls-row">
					{renderOrder()}
					{renderPreviewType()}
					{renderPreviewElements()}
					{renderLimit()}
					{renderPinnedPubs()}
				</div>
			</div>
			<LayoutPubs pubs={pubsInBlock} content={block.content} />
		</div>
	);
};

export default LayoutEditorPubs;
