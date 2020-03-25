import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from '@blueprintjs/core';

import { LinkedPageSelect } from 'components';
import { MenuButton, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'utils';

import PubSelect from './PubSelect';

const propTypes = {
	overviewData: PropTypes.object.isRequired,
	collection: PropTypes.object.isRequired,
	updateCollection: PropTypes.func.isRequired,
	collectionPubs: PropTypes.array.isRequired,
	addCollectionPub: PropTypes.func.isRequired,
};

const CollectionControls = (props) => {
	const { overviewData, collection, updateCollection, collectionPubs, addCollectionPub } = props;
	const { scopeData, communityData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	const { activeCommunity } = scopeData.elements;
	const { isPublic } = collection;
	const [newPubIsLoading, setNewPubIsLoading] = useState(false);

	const handleCreatePub = () => {
		setNewPubIsLoading(true);
		return apiFetch('/api/pubs', {
			method: 'POST',
			body: JSON.stringify({
				communityId: communityData.id,
				defaultCollectionIds: [collection.id],
			}),
		})
			.then((newPub) => {
				window.location.href = `/pub/${newPub.slug}`;
			})
			.catch((err) => {
				console.error(err);
				setNewPubIsLoading(false);
			});
	};

	if (!canManage) {
		return null;
	}
	return (
		<React.Fragment>
			<ButtonGroup>
				<MenuButton
					aria-label="Set collection public or private"
					buttonContent={isPublic ? 'Public' : 'Private'}
					buttonProps={{
						icon: isPublic ? 'globe' : 'lock2',
						rightIcon: 'caret-down',
					}}
				>
					<MenuItem
						icon={isPublic ? 'tick' : 'blank'}
						text="Public"
						onClick={() => updateCollection({ isPublic: true })}
					/>
					<MenuItem
						icon={isPublic ? 'blank' : 'tick'}
						text="Private"
						onClick={() => updateCollection({ isPublic: false })}
					/>
				</MenuButton>
				<LinkedPageSelect
					selfContained={true}
					communityData={activeCommunity}
					collection={collection}
					onSelectPage={(page) => updateCollection({ pageId: page.id })}
				/>
				<PubSelect
					pubs={overviewData.pubs}
					usedPubIds={collectionPubs.map((cp) => cp.pubId)}
					onSelectPub={addCollectionPub}
				>
					<Button icon="plus">Add Pubs</Button>
				</PubSelect>
			</ButtonGroup>
			<Button
				icon="edit"
				text="New Pub"
				onClick={handleCreatePub}
				loading={newPubIsLoading}
			/>
		</React.Fragment>
	);
};

CollectionControls.propTypes = propTypes;
export default CollectionControls;
