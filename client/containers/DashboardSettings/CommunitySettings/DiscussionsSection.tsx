import type { Community, DiscussionCreationAccess } from 'types';

import React, { useCallback } from 'react';

import { Callout, Radio, RadioGroup } from '@blueprintjs/core';

import { SettingsSection } from 'components';
import { usePageContext } from 'utils/hooks';

type Props = {
	communityData?: Community & { discussionCreationAccess?: DiscussionCreationAccess };
	updateCommunityData?: (
		update: Partial<Community> & { discussionCreationAccess?: DiscussionCreationAccess },
	) => void;
};

export default function DiscussionsSection(props: Props) {
	const {
		scopeData: { activePermissions },
	} = usePageContext();

	const communityData = props.communityData;
	const updateCommunityData = props.updateCommunityData;

	const discussionCreationAccess: DiscussionCreationAccess =
		communityData?.discussionCreationAccess ?? activePermissions.discussionCreationAccess;

	const handleChange = useCallback(
		(value: DiscussionCreationAccess) => {
			updateCommunityData?.({ discussionCreationAccess: value });
		},
		[updateCommunityData],
	);

	if (!updateCommunityData) {
		return null;
	}

	return (
		<SettingsSection title="Discussions">
			<p>Who can create new discussions on Pubs?</p>
			<RadioGroup
				selectedValue={discussionCreationAccess}
				onChange={(e) => {
					const value = (e.target as HTMLInputElement).value as DiscussionCreationAccess;
					handleChange(value);
				}}
			>
				<Radio value="public">Anyone</Radio>
				<Radio value="contributors-members">
					Members of the Community, Collection the Pub is in, or the Pub itself &
					Contributors to the Collection the Pub is in, or the Pub itself
				</Radio>
				<Radio value="disabled">Disabled (except for Admins of your Community)</Radio>
			</RadioGroup>

			<Callout intent="warning">
				<p>
					This setting applies to all Pubs and Collections in the Community, and only
					applies to new discussions.
				</p>
				<p>Users with existing discussions will still be able to edit and archive them.</p>
			</Callout>
		</SettingsSection>
	);
}
