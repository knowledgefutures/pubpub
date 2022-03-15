import React from 'react';
import { PubAttributionEditor } from 'components';

import { usePageContext } from 'utils/hooks';
import { PubPageData, DefinitelyHas } from 'types';

import SpubHeaderTab from './SpubHeaderTab';

type Props = {
	pubData: DefinitelyHas<PubPageData, 'submission'>;
	onUpdatePub: (pub: Partial<PubPageData>) => unknown;
};

const ContributorsTab = (props: Props) => {
	const { onUpdatePub, pubData } = props;
	const { communityData } = usePageContext();

	return (
		<SpubHeaderTab>
			<p>
				Add the names, roles & affiliations of other people who have a part to play in the
				creation of this submission’s content.
			</p>
			<PubAttributionEditor
				pubData={pubData}
				communityData={communityData}
				updatePubData={onUpdatePub}
				canEdit
			/>
		</SpubHeaderTab>
	);
};

export default ContributorsTab;
