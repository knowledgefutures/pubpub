import React from 'react';
import dateFormat from 'dateformat';
import { NonIdealState } from '@blueprintjs/core';

import { getSchemaForKind } from 'utils/collections/schemas';
import { capitalize } from 'utils/strings';
import { usePageContext } from 'utils/hooks';
import { DashboardFrame } from 'components';

import { useCollectionState, useCollectionPubs } from './collectionState';
import CollectionControls from './CollectionControls';
import PubMenu from './PubMenu';
import OverviewBlocks from '../OverviewBlocks';
import OverviewTable from '../OverviewTable';

require('./collectionOverview.scss');

type Props = {
	overviewData: any;
};

const collectionPubsByPubId = (collectionPubs) => {
	const res = {};
	collectionPubs.forEach((cp) => {
		res[cp.pubId] = cp;
	});
	return res;
};

const CollectionOverview = (props: Props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activeCollection } = scopeData.elements;
	const { canManage } = scopeData.activePermissions;
	const collectionSchema = getSchemaForKind(activeCollection.kind);
	const label = capitalize(collectionSchema?.label.singular);

	const { collection, updateCollection } = useCollectionState(scopeData);
	const {
		collectionPubs,
		reorderCollectionPubs,
		addCollectionPub,
		setCollectionPubContextHint,
		setCollectionPubIsPrimary,
		removeCollectionPub,
	} = useCollectionPubs(scopeData, overviewData);

	const pubList = collectionPubs.map((cp) => cp.pub);
	const byPubId = collectionPubsByPubId(collectionPubs);

	const renderRowControls = (pub) => {
		const collectionPub = byPubId[pub.id];
		if (!collectionPub) {
			return null;
		}
		return (
			<PubMenu
				collection={collection}
				collectionPub={collectionPub}
				setCollectionPubContextHint={setCollectionPubContextHint}
				setCollectionPubIsPrimary={setCollectionPubIsPrimary}
				removeCollectionPub={removeCollectionPub}
			/>
		);
	};

	return (
		<DashboardFrame
			className="collection-overview-component"
			title="Overview"
			icon={collectionSchema ? collectionSchema.bpDisplayIcon : ''}
			details={
				<span>
					This collection is a {label}. It was created on{' '}
					<i>{dateFormat(activeCollection.createdAt, 'mmmm dd, yyyy')}</i> and now
					contains:
				</span>
			}
			controls={
				<CollectionControls
					overviewData={overviewData}
					collection={collection}
					updateCollection={updateCollection}
					collectionPubs={collectionPubs}
					addCollectionPub={addCollectionPub}
				/>
			}
		>
			<OverviewBlocks pubs={pubList} />
			<OverviewTable
				title="Pubs in this collection"
				// @ts-expect-error ts-migrate(2322) FIXME: Type '(item: any) => any' is not assignable to typ... Remove this comment to see the full error message
				generateLabel={(item) => {
					// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
					const contextHint = collectionSchema.contextHints.find(
						(ch) => ch.value === item.contextHint,
					);
					return contextHint && contextHint.label;
				}}
				pubList={pubList}
				// @ts-expect-error ts-migrate(2322) FIXME: Type '(sourceIndex: any, destinationIndex: any) =>... Remove this comment to see the full error message
				onReorder={canManage ? reorderCollectionPubs : undefined}
				// @ts-expect-error ts-migrate(2322) FIXME: Type '(pub: any) => Element | null' is not assigna... Remove this comment to see the full error message
				rowControls={renderRowControls}
				emptyState={
					<NonIdealState
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'false | E... Remove this comment to see the full error message
						icon={collectionSchema.bpDisplayIcon}
						// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
						title={`This ${collectionSchema.label.singular} doesn't contain any pubs yet!`}
						description="Choose 'Add Pubs' from above to add some."
					/>
				}
			/>
		</DashboardFrame>
	);
};
export default CollectionOverview;
