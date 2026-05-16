import type { Community, DiscussionCreationAccess } from 'types';

import React from 'react';

import { AnchorButton, Callout } from '@blueprintjs/core';

import { SettingsSection } from 'components';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

import DeleteCommunity from './DeleteCommunity';
import DiscussionsSection from './DiscussionsSection';
import { ExportCommunityDataButton } from './ExportCommunityDataButton';
import TransferOwnership from './TransferOwnership';

type PastExport = {
	id: string;
	createdAt: string;
	isProcessing: boolean;
	output: string | null;
	error: string | null;
};

type Props = {
	settingsData: {
		archives?: PastExport[];
	};
	communityData?: Community & { discussionCreationAccess?: DiscussionCreationAccess };
	updateCommunityData?: (
		update: Partial<Community> & { discussionCreationAccess?: DiscussionCreationAccess },
	) => void;
};

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const MAX_DAILY_EXPORTS = 2;

const ExportDataSection = (props: Props) => {
	const {
		loginData: { isSuperAdmin },
	} = usePageContext();

	const alreadyDoneExports = props.settingsData.archives?.filter(
		(task) => new Date().getTime() - new Date(task.createdAt).getTime() < ONE_DAY_IN_MS,
	);

	const remainingExports = isSuperAdmin
		? Infinity
		: Math.max(MAX_DAILY_EXPORTS - (alreadyDoneExports?.length || 0), 0);

	return (
		<SettingsSection title="Export">
			<p>
				Download a complete copy of your community's data. This creates a .zip archive
				containing rendered HTML files for all pub releases and drafts, downloaded media
				assets, and structured JSON data including pubs, collections, pages, members,
				activity, and settings.
			</p>

			<ExportCommunityDataButton
				disabled={remainingExports === 0}
				pastExports={props.settingsData.archives}
			/>
		</SettingsSection>
	);
};

const ExportAndDeleteSettings = (props: Props) => {
	const {
		communityData,
		scopeData: {
			activePermissions: { canAdminCommunity },
		},
	} = usePageContext();

	if (!canAdminCommunity) {
		return null;
	}

	return (
		<>
			<SettingsSection title="Custom CSS">
				<Callout intent="warning" icon="warning-sign">
					<p>
						Custom CSS lets you change the look and feel of your Community, but it also
						lets you introduce bugs that make it hard or impossible to use. The PubPub
						team may also make changes to our own source code that could break your CSS
						without warning. We don't provide support for problems caused by Custom CSS.
						Use caution (but have fun!)
					</p>
					<AnchorButton target="_blank" href={getDashUrl({ mode: 'scripts' })}>
						Customize CSS
					</AnchorButton>
				</Callout>
			</SettingsSection>
			<DiscussionsSection
				communityData={props.communityData}
				updateCommunityData={props.updateCommunityData}
			/>

			<ExportDataSection settingsData={props.settingsData} />

			<TransferOwnership communityData={communityData} />

			<DeleteCommunity communityData={communityData} />
		</>
	);
};

export default ExportAndDeleteSettings;
