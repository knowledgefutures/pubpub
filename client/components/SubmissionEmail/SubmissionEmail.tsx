import React from 'react';

import { Community } from 'types';
import { communityUrl } from 'utils/canonicalUrls';

type Props = {
	community: Community;
	customText: React.ReactNode;
	submissionTitle: string;
	submissionUrl?: string;
	submitterName: React.ReactNode;
};

const SubmissionEmail = (props: Props) => {
	const { community, customText, submissionTitle, submissionUrl, submitterName } = props;

	const communityLink = <a href={communityUrl(community)}>{community.title}</a>;

	const submissionLink = submissionUrl ? (
		<a href={submissionUrl}>{submissionTitle}</a>
	) : (
		<u>{submissionTitle}</u>
	);

	return (
		<div>
			<p>Hello {submitterName},</p>
			<p>
				Your submission <i>{submissionLink}</i> to {communityLink} has been received. You
				may reply to this email thread to reach us.
			</p>
			{customText}
		</div>
	);
};

export default SubmissionEmail;
