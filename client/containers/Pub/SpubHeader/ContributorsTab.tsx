import React from 'react';

import { PubAttributionEditor } from 'components';
import { usePageContext } from 'utils/hooks';
import { Callback, Pub } from 'types';

import SpubHeaderField from './SpubHeaderField';
import SpubHeaderTab from './SpubHeaderTab';

require('./contributorsTab.scss');

type Props = {
	pubData: Pub;
	onUpdatePub: Callback<Partial<Pub>>;
};

const ContributorsTab = (props: Props) => {
	const { onUpdatePub, pubData } = props;
	const { communityData } = usePageContext();

	const contributorCount = pubData.attributions.length;
	const title = <>Contributors {contributorCount ? `(${contributorCount})` : null}</>;

	return (
		<SpubHeaderTab>
			<SpubHeaderField title={title} fullWidth>
				<PubAttributionEditor
					pubData={pubData}
					communityData={communityData}
					updatePubData={onUpdatePub}
					canEdit
				/>
			</SpubHeaderField>
		</SpubHeaderTab>
	);
};

export default ContributorsTab;
