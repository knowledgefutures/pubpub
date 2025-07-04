import React, { useMemo, useState } from 'react';
import { AnchorButton, Button, Callout } from '@blueprintjs/core';
import stripIndent from 'strip-indent';

import { Community } from 'types';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { SettingsSection } from 'components';
import type { WorkerTask } from 'server/models';
import { isDataExportEnabled } from 'utils/analytics/featureFlags';
import { ExportCommunityDataButton } from './ExportCommunityDataButton';

const getEmails = (communityData: Community) => {
	const exportEmailBody = stripIndent(`
        Hello.
        %0D%0A%0D%0A
        I am writing to request an export of any PubPub community data associated with the community%20
        ${communityData.title} (${communityData.subdomain}).
    `);

	const deleteEmailBody = stripIndent(`
        Hello.
        %0D%0A%0D%0A
        I am writing to request that the PubPub community ${communityData.title}%20
        (${communityData.subdomain}), and all data associated with that community, be deleted.
        %0D%0A%0D%0A
        I affirm that I have the legal authority to request this on behalf of my community,%20
        and understand that this action may be irreversible.
    `);

	return { exportEmailBody, deleteEmailBody };
};

type Props = {
	settingsData: {
		archives?: WorkerTask[];
	};
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
	const remainingExports = isSuperAdmin
		? '∞'
		: Math.max(MAX_DAILY_EXPORTS - (alreadyDoneExports?.length || 0), 0);

	return (
		<SettingsSection title="Export">
			<p>
				Export your communities data. Will create a zip archive with all publically
				accessible pages in your community as HTML files, as well as a JSON file containing
				structured information about your community.
			</p>
			<p>You have {remainingExports} remaining daily exports.</p>
			<ExportCommunityDataButton disabled={remainingExports === 0} />

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
										href={`${archive.output}.zip` as string}
										target="_blank"
									>
										Download
									</AnchorButton>
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

	const { deleteEmailBody } = useMemo(() => getEmails(communityData), [communityData]);

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
			{/* <SettingsSection title="Data Export">
				<p>
					You can request an export of the data associated with your Community on PubPub
					using the button below.
				</p>
				<AnchorButton
					target="_blank"
					href={`mailto:privacy@pubpub.org?subject=Community+data+export+request&body=${exportEmailBody.trim()}`}
				>
					Request data export
				</AnchorButton>
			</SettingsSection> */}
			<SettingsSection title="Community Deletion">
				<p>
					You can request that we completely delete your PubPub Community using the button
					below. If you have published any notable Pubs, we may reserve the right to
					continue to display them based on the academic research exception to GDPR.
				</p>
				<AnchorButton
					intent="danger"
					target="_blank"
					href={`mailto:privacy@pubpub.org?subject=Community+deletion+request&body=${deleteEmailBody.trim()}`}
				>
					Request Community deletion
				</AnchorButton>
			</SettingsSection>
		</>
	);
};

export default ExportAndDeleteSettings;
