import React from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';

import { LinkedPageSelect } from 'components';
import { MenuButton, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';

import PubSelect from './PubSelect';

type Props = {
	overviewData: any;
	collection: any;
	updateCollection: (...args: any[]) => any;
	collectionPubs: any[];
	addCollectionPub: (...args: any[]) => any;
};

const CollectionControls = (props: Props) => {
	const { overviewData, collection, updateCollection, collectionPubs, addCollectionPub } = props;
	const { scopeData } = usePageContext();
	const { canManage } = scopeData.activePermissions;
	const { activeCommunity } = scopeData.elements;
	const { isPublic } = collection;

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
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
					usedPubIds={collectionPubs.map((cp) => cp.pubId)}
					onSelectPub={addCollectionPub}
				>
					<Button icon="plus">Add Pubs</Button>
				</PubSelect>
			</ButtonGroup>
		</React.Fragment>
	);
};
export default CollectionControls;
