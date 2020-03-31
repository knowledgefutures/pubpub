import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { NonIdealState } from '@blueprintjs/core';

import { getSchemaForKind } from 'shared/collections/schemas';
import { capitalize } from 'utils';
import { usePageContext } from 'utils/hooks';
import { DashboardFrame } from 'components';

import { useCollectionState, useCollectionPubs } from './collectionState';
import CollectionControls from './CollectionControls';
import PubMenu from './PubMenu';
import OverviewBlocks from '../OverviewBlocks';
import OverviewTable from '../OverviewTable';

require('./collectionOverview.scss');

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const CollectionOverview = (props) => {
	const { overviewData } = props;
	const { scopeData } = usePageContext();
	const { activeCollection } = scopeData.elements;
	const { canManage } = scopeData.activePermissions;
	const collectionSchema = getSchemaForKind(activeCollection.kind);
	const label = capitalize(collectionSchema.label.singular);

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

	return (
		<DashboardFrame
			className="collection-overview-component"
			title="Overview"
			details={
				<span>
					This • {label} • collection was created on
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
				generateLabel={(item) => {
					const contextHint = collectionSchema.contextHints.find(
						(ch) => ch.value === item.contextHint,
					);
					return contextHint && contextHint.label;
				}}
				pubList={pubList}
				onReorder={canManage ? reorderCollectionPubs : undefined}
				rowControls={(collectionPub) => (
					<PubMenu
						collectionPub={collectionPub}
						setCollectionPubContextHint={setCollectionPubContextHint}
						setCollectionPubIsPrimary={setCollectionPubIsPrimary}
						removeCollectionPub={removeCollectionPub}
					/>
				)}
				emptyState={
					<NonIdealState
						icon={collectionSchema.bpDisplayIcon}
						title={`This ${collectionSchema.label.singular} doesn't contain any pubs yet!`}
						description="Choose 'Add Pubs' from above to add some."
					/>
				}
			/>
		</DashboardFrame>
	);
};

CollectionOverview.propTypes = propTypes;
export default CollectionOverview;
