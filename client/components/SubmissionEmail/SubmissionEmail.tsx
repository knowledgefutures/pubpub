import React from 'react';

import { Community, SubmissionEmailKind } from 'types';
import { communityUrl } from 'utils/canonicalUrls';

type Props = {
	community: Community;
	customText: React.ReactNode;
	submissionTitle: string;
	submissionUrl?: string;
	submitterName: React.ReactNode;
	kind: SubmissionEmailKind;
};

const SubmissionEmail = (props: Props) => {
	const { community, customText, submissionTitle, submissionUrl, submitterName, kind } = props;

	const communityLink = <a href={communityUrl(community)}>{community.title}</a>;

	const submissionLink = submissionUrl ? (
		<a href={submissionUrl}>{submissionTitle}</a>
	) : (
		<u>{submissionTitle}</u>
	);

	const submissionNounPhrase = (
		<>
			Your submission <i>{submissionLink}</i> to {communityLink}
		</>
	);

	const renderBoilerplate = () => {
		if (kind === 'received') {
			return (
				<>
					{submissionNounPhrase} has been received. You may reply to this email thread to
					reach us.
				</>
			);
		}
		if (kind === 'accepted') {
			return <>{submissionNounPhrase} has been accepted.</>;
		}
		return <>{submissionNounPhrase} has been declined.</>;
	};

	return (
		<div>
			<p>Hello {submitterName},</p>
			<p>{renderBoilerplate()}</p>
			{customText}
		</div>
	);
};

export default SubmissionEmail;
