import React from 'react';

import { Callout } from '@blueprintjs/core';

import { usePageContext } from 'utils/hooks';

import './pubArchiveNotice.scss';

const PubArchiveNotice = () => {
	const { communityData } = usePageContext();

	if (!communityData.isArchiveCommunity) {
		return null;
	}

	return (
		<Callout icon="archive" intent="primary" className="pub-archive-notice-component">
			<p>
				This publication's community has been removed. This page is maintained to preserve
				the scholarly record.
			</p>
		</Callout>
	);
};

export default PubArchiveNotice;
