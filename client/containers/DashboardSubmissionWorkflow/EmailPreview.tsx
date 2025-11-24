import type { Community } from 'types';

import React from 'react';

import { SubmissionEmail } from 'components';

import './emailPreview.scss';

type Props = {
	from: string;
	to: string;
	cc: string[];
	body: React.ReactNode;
	community: Community;
	collectionTitle: string;
} & Pick<React.ComponentProps<typeof SubmissionEmail>, 'kind'>;

const EmailPreview = (props: Props) => {
	const { from, to, cc, body, community, kind, collectionTitle } = props;

	return (
		<div className="email-preview-component">
			<div className="address-header">
				<div className="address-box">
					<div className="label">From:</div>
					<div className="address">{from}</div>
				</div>
				<div className="address-box">
					<div className="label">To:</div>
					<div className="address">{to}</div>
				</div>
				{cc.length && (
					<div className="address-box">
						<div className="label">CC:</div>
						<div className="address">{cc.join(', ')}</div>
					</div>
				)}
			</div>
			<div className="content-box">
				<SubmissionEmail
					submitterName="Submitter Name"
					submissionTitle="My Example Submission"
					collectionTitle={collectionTitle}
					community={community}
					customText={body}
					kind={kind}
				/>
			</div>
		</div>
	);
};

export default EmailPreview;
