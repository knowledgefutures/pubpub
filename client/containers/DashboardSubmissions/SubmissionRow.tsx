import React, { useState } from 'react';
import classNames from 'classnames';

import { getSubmissionTimeLabel, IconLabelPair } from '../DashboardOverview/overviewRows/labels';

import { PubOverviewRow } from '../DashboardOverview/overviewRows';
import { PubWithSubmission } from './types';
import ArbitrationMenu from './ArbitrationMenu';

require('./submissionRow.scss');

type Props = {
	pub: PubWithSubmission;
};

const SubmissionRow = (props: Props) => {
	const { pub } = props;
	const [status, setStatus] = useState(pub.submission.status);
	const [isDeleted, setIsDeleted] = useState(false);

	const statusLabel: IconLabelPair = {
		label: pub.submission.status[0].toUpperCase() + pub.submission.status.slice(1),
		icon: 'symbol-square',
		iconSize: 16,
		iconClass: `status-color-${pub.submission.status}`,
	};

	const labels = [statusLabel, getSubmissionTimeLabel(pub)].filter(
		(x): x is IconLabelPair => !!x,
	);

	if (isDeleted) {
		return null;
	}

	return (
		<PubOverviewRow
			pub={pub}
			leftIconElement="manually-entered-data"
			className={classNames('submission-row-component', status)}
			labels={labels}
			rightElement={
				<ArbitrationMenu
					pub={pub}
					onJudgePub={setStatus}
					onDeletePub={() => setIsDeleted(true)}
				/>
			}
		/>
	);
};

export default SubmissionRow;
