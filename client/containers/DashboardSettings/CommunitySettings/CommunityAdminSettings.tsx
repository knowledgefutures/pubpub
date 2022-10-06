import React, { useMemo } from 'react';
import { AnchorButton, Callout } from '@blueprintjs/core';
import stripIndent from 'strip-indent';

import { Community } from 'types';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { SettingsSection } from 'components';

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

const ExportAndDeleteSettings = () => {
	const {
		communityData,
		scopeData: {
			activePermissions: { canAdminCommunity },
		},
	} = usePageContext();

	const { exportEmailBody, deleteEmailBody } = useMemo(
		() => getEmails(communityData),
		[communityData],
	);

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
			<SettingsSection title="Data Export">
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
			</SettingsSection>
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
