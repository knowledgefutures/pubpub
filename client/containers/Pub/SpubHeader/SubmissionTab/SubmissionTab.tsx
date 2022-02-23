import React, { useState } from 'react';
import { Tab, Tabs } from '@blueprintjs/core';

import { PubPageData, DefinitelyHas, DocJson } from 'types';

import TitleDescriptionAbstract from './TitleDescriptionAbstract';
import Contributors from './Contributors';
import SpubSettings from './SpubSettings';

type Props = {
	pub: DefinitelyHas<PubPageData, 'submission'>;
	abstract: DocJson;
	onUpdatePub: (pub: Partial<PubPageData>) => unknown;
	onUpdateAbstract: (abstract: DocJson) => Promise<unknown>;
};

const SubmissionTab = (props: Props) => {
	const [selectedTab, setSelectedTab] = useState('title-description-abstract');
	const maybeActiveClass = (tabId: string) => `${tabId === selectedTab ? 'active' : 'inactive'}`;

	return (
		<Tabs
			className="submission-tab-component"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Dispatch<SetStateAction<string>>' is not ass... Remove this comment to see the full error message
			onChange={setSelectedTab}
			selectedTabId={selectedTab}
		>
			<Tab
				id="title-description-abstract"
				title="Title, Description & Abstract"
				className={`title-description-abstract ${maybeActiveClass(
					'title-description-abstract',
				)}`}
				panel={
					<TitleDescriptionAbstract
						pub={props.pub}
						abstract={props.abstract}
						onUpdatePub={props.onUpdatePub}
						onUpdateAbstract={props.onUpdateAbstract}
					/>
				}
			/>
			<Tab
				className={maybeActiveClass('contributors')}
				id="contributors"
				title="Contributors"
				panel={<Contributors pubData={props.pub} onUpdatePub={props.onUpdatePub} />}
			/>
			<Tab
				className={maybeActiveClass('spubSettings')}
				id="spubSettings"
				title="Pub Settings"
				panel={<SpubSettings pubData={props.pub} onUpdatePub={props.onUpdatePub} />}
			/>
		</Tabs>
	);
};

export default SubmissionTab;
