import React from 'react';
import { Label } from '@blueprintjs/core';

import { PubAttributionEditor } from 'components';
import { usePageContext } from 'utils/hooks';
import { PubPageData } from 'types';

import SpubHeaderTab from './SpubHeaderTab';

require('./contributorsTabComponent.scss');

type Props = {
	pubData: PubPageData;
	onUpdatePub: (pub: Partial<PubPageData>) => unknown;
};

const ContributorsTab = (props: Props) => {
	const { onUpdatePub, pubData } = props;
	const { communityData } = usePageContext();
	const contributorCount = pubData.attributions.length;

	return (
		<SpubHeaderTab className="contributors-tab-component">
			<p className="instruction">
				Add the names, roles & affiliations of other people who have a part to play in the
				creation of this submission's content.
			</p>
			<Label>
				<h2 className="contributors-header">
					Contributors {contributorCount && `(${contributorCount})`}
				</h2>
				<PubAttributionEditor
					pubData={pubData}
					communityData={communityData}
					updatePubData={onUpdatePub}
					canEdit
				/>
			</Label>
		</SpubHeaderTab>
	);
};

export default ContributorsTab;
