import React from 'react';
import { AnchorButton } from '@blueprintjs/core';

import { Editor, GridWrapper } from 'components';
import { LayoutBlockSubmissionBanner } from 'utils/layout';
import { usePageContext } from 'utils/hooks';

import LayoutSubmissionBannerSkeleton from './LayoutSubmissionBannerSkeleton';

type Props = {
	content: LayoutBlockSubmissionBanner['content'];
};

const LayoutSubmissionBanner = (props: Props) => {
	const {
		content: { body, title, submissionWorkflowId },
	} = props;

	const {
		loginData: { id: userId },
	} = usePageContext();

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
								<AnchorButton href={`/submit/${submissionWorkflowId}`}>
									{userId ? 'Create a submission' : 'Log in to submit'}
								</AnchorButton>
							</>
						}
					/>
				</GridWrapper>
			</div>
		</div>
	);
};

export default LayoutSubmissionBanner;
