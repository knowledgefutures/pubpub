import type { WorkerTask } from 'server/models';
import type { Community, DiscussionCreationAccess } from 'types';

import React, { useState } from 'react';

import { AnchorButton, Button, Callout } from '@blueprintjs/core';

import { SettingsSection } from 'components';
import { isDataExportEnabled } from 'utils/analytics/featureFlags';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

import DeleteCommunity from './DeleteCommunity';
import DiscussionsSection from './DiscussionsSection';
import { type ArchiveTask, ExportCommunityDataButton } from './ExportCommunityDataButton';

type Props = {
	settingsData: {
		archives?: WorkerTask[];
	};
	communityData?: Community & { discussionCreationAccess?: DiscussionCreationAccess };
	updateCommunityData?: (
		update: Partial<Community> & { discussionCreationAccess?: DiscussionCreationAccess },
	) => void;
};

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const MAX_DAILY_EXPORTS = 5;

const ExportDataSection = (props: Props) => {
	const [seePreviousExports, setSeePreviousExports] = useState(false);
	const {
		loginData: { isSuperAdmin },
	} = usePageContext();

	const alreadyDoneExports = props.settingsData.archives?.filter(
		(archiveTask) =>
			new Date().getTime() - new Date(archiveTask.createdAt).getTime() < ONE_DAY_IN_MS,
	);

	const lastExport = props.settingsData.archives?.[0] as ArchiveTask;

	const remainingExports = isSuperAdmin
		? '∞'
		: Math.max(MAX_DAILY_EXPORTS - (alreadyDoneExports?.length || 0), 0);

	return (
		<SettingsSection title="Export">
			<p>
				Export your Community's data. This will create a .zip archive with all publicly
				accessible pages in your community as HTML files, as well as a JSON file containing
				structured information about your community.
			</p>
			<p>
				<strong>Note</strong>: If you don't see your Pub or page/collection in the export,
				please publish it or set it to public respectively, then try again.
			</p>

			<p>You have {remainingExports} remaining daily exports.</p>
			<ExportCommunityDataButton disabled={remainingExports === 0} lastExport={lastExport} />

			<hr />
			<Button
				icon={seePreviousExports ? 'arrow-up' : 'arrow-down'}
				minimal
				onClick={() => setSeePreviousExports(!seePreviousExports)}
			>
				{seePreviousExports ? 'Hide previous exports' : 'Show previous exports'}
			</Button>
			{seePreviousExports && (
				<section>
					{props.settingsData.archives?.map(
						(archive) =>
							typeof archive.output === 'string' && (
								<div
									key={archive.id}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										marginBottom: '4px',
										fontSize: '10px',
									}}
								>
									<span>
										Data export from{' '}
										{new Date(archive.createdAt).toLocaleString()}{' '}
									</span>
									<AnchorButton
										minimal
										href={`${archive.output}` as string}
										target="_blank"
										icon="download"
										title="Download Archive"
										aria-label="Download Archive"
										download
									/>
								</div>
							),
					)}
				</section>
			)}
		</SettingsSection>
	);
};

const ExportAndDeleteSettings = (props: Props) => {
	const {
		communityData,
		scopeData: {
			activePermissions: { canAdminCommunity },
		},
		loginData: { isSuperAdmin },
		featureFlags,
	} = usePageContext();

	if (!canAdminCommunity) {
		return null;
	}

	const canExportData = isDataExportEnabled(featureFlags) || isSuperAdmin;

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
			{canExportData && <ExportDataSection settingsData={props.settingsData} />}

			<DiscussionsSection
				communityData={props.communityData}
				updateCommunityData={props.updateCommunityData}
			/>

			<DeleteCommunity communityData={communityData} />
		</>
	);
};

export default ExportAndDeleteSettings;
