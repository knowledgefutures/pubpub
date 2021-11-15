import React from 'react';
import { Icon } from '@blueprintjs/core';

import { SubmissionEmail } from 'components';
import { Community } from 'types';

require('./emailPreview.scss');

type Props = {
	from: string;
	to: string;
	cc: null | string;
	body: React.ReactNode;
	community: Community;
};

const EmailPreview = (props: Props) => {
	const { from, to, cc, body, community } = props;

	return (
		<div className="email-preview-component">
			<div className="address-header">
				<Icon icon="envelope" />
				<div className="address-box">
					<div className="label">From:</div>
					<div className="address">{from}</div>
				</div>
				<div className="address-box">
					<div className="label">To:</div>
					<div className="address">{to}</div>
				</div>
				{cc && (
					<div className="address-box">
						<div className="label">CC:</div>
						<div className="address">{cc}</div>
					</div>
				)}
			</div>
			<div className="content-box">
				<SubmissionEmail
					submitterName="Submitter Name"
					submissionTitle="My Example Submission"
					community={community}
					customText={body}
				/>
			</div>
		</div>
	);
};

export default EmailPreview;
