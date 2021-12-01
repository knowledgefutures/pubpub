import React, { useCallback, useState } from 'react';
import { Button } from '@blueprintjs/core';

import { Editor, GridWrapper } from 'components';
import { LayoutBlockSubmissionBanner } from 'utils/layout';
import { apiFetch } from 'client/utils/apiFetch';

import LayoutSubmissionBannerSkeleton from './LayoutSubmissionBannerSkeleton';

type Props = {
	content: LayoutBlockSubmissionBanner['content'];
};

const LayoutSubmissionBanner = (props: Props) => {
	const {
		content: { body, title, submissionWorkflowId },
	} = props;
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmitClicked = useCallback(() => {
		setIsLoading(true);
		apiFetch
			.post('/api/submissions', { submissionWorkflowId })
			.then(({ pub }) => {
				window.location.href = `/pub/${pub.slug}`;
			})
			.finally(() => setIsLoading(false));
	}, [submissionWorkflowId]);

	return (
		<div className="layout-text-component">
			<div className="block-content">
				<GridWrapper>
					<LayoutSubmissionBannerSkeleton
						useCommunityAccentColor
						title={title}
						content={
							<>
								<Editor initialContent={body} isReadOnly />
								<Button loading={isLoading} onClick={handleSubmitClicked}>
									Submit
								</Button>
							</>
						}
					/>
				</GridWrapper>
			</div>
		</div>
	);
};

export default LayoutSubmissionBanner;
