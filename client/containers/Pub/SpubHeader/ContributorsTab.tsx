import type { Callback, Pub } from 'types';

import React from 'react';

import { PubAttributionEditor } from 'components';
import { expect } from 'utils/assert';
import { usePageContext } from 'utils/hooks';

import SpubHeaderField from './SpubHeaderField';
import SpubHeaderTab from './SpubHeaderTab';

import './contributorsTab.scss';

type Props = {
	pubData: Pub;
	onUpdatePub: Callback<Partial<Pub>>;
};

const ContributorsTab = (props: Props) => {
	const { onUpdatePub, pubData } = props;
	const { communityData } = usePageContext();

	const contributorCount = expect(pubData.attributions).length;
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
