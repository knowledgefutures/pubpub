import React, { useCallback } from 'react';
import classNames from 'classnames';
import { Button } from '@blueprintjs/core';

import {
	CollectionMultiSelect,
	InputField,
	Popover,
	MenuSelect,
	MenuSelectItems,
} from 'components';
import { LayoutPubs } from 'components/Layout';
import { Community, Pub, Collection } from 'types';
import { LayoutBlockPubs, PubPreviewType, PubSortOrder } from 'types/layout';

import PreviewElements from './PreviewElements';
import LimitPubs from './LimitPubs';
import PinnedPubs from './PinnedPubs';

type Content = LayoutBlockPubs['content'];

type Props = {
	onChange: (index: number, content: Partial<Content>) => any;
	layoutIndex: number;
	loading?: boolean;
	block: LayoutBlockPubs;
	pubsInBlock: Pub[];
	communityData: Community & { collections: Collection[] };
	scopedCollectionId?: string;
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

const LayoutEditorPubs = (props: Props) => {
	const {
		onChange: fullOnChange,
		layoutIndex,
		block,
		pubsInBlock,
		communityData,
		loading,
		scopedCollectionId,
	} = props;
	const { limit, pubIds = [], collectionIds = [], pubPreviewType, sort } = block.content;

	const onChange = useCallback(
		(update: Partial<Content>) => fullOnChange(layoutIndex, update),
		[fullOnChange, layoutIndex],
	);

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
				pubIds: pubIds.slice(0, nextLimit || Infinity),
			}),
		[onChange, pubIds],
	);

	const setSort = useCallback(
		(nextSort: PubSortOrder) =>
			onChange({
				sort: nextSort,
			}),
		[onChange],
	);

	const setCollectionIds = useCallback(
		(nextCollectionIds: string[]) =>
			onChange({
				collectionIds: nextCollectionIds,
			}),
		[onChange],
	);

	const setPubIds = useCallback(
		(nextPubIds: string[]) =>
			onChange({
				pubIds: nextPubIds,
				limit:
					typeof limit === 'number' && limit > 0
						? Math.max(limit, nextPubIds.length)
						: limit,
			}),
		[onChange, limit],
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
				aria-label="Limit number of Pubs"
				content={<LimitPubs limit={block.content.limit} onChangeLimit={setLimit} />}
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
				value={sort || null}
				defaultLabel={<i>Choose</i>}
				icon="sort"
				prefix={<b>Sort: </b>}
			/>
		);
	};

	const renderPinnedPubs = () => {
		return (
			<Popover
				aria-label="Choose pinned Pubs for this block"
				className="order-picker-popover"
				placement="bottom-end"
				content={
					<PinnedPubs
						onPubIds={setPubIds}
						pubIds={pubIds}
						pubsInBlock={pubsInBlock}
						scopedCollectionId={scopedCollectionId}
					/>
				}
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
				aria-label="Choose preview elements"
				content={<PreviewElements content={block.content} onChangeContent={onChange} />}
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
