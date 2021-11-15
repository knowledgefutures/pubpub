import React from 'react';
import Color from 'color';
import classNames from 'classnames';

import { usePageContext } from 'utils/hooks';

require('./layoutSubmissionBannerSkeleton.scss');

type Props = {
	className?: string;
	title: React.ReactNode;
	content: React.ReactNode;
	onSubmitClicked?: () => unknown;
	useCommunityAccentColor?: boolean;
};

const LayoutSubmissionBannerSkeleton = (props: Props) => {
	const { title, content, onSubmitClicked, className, useCommunityAccentColor } = props;
	const {
		communityData: { accentColorDark },
	} = usePageContext();

	// TODO(ian): actually use this in a button or something
	void onSubmitClicked;

	const backgroundColor = Color(accentColorDark).alpha(0.2).toString();

	return (
		<div
			className={classNames('layout-submission-banner-skeleton-component', className)}
			style={useCommunityAccentColor ? { backgroundColor } : {}}
		>
			<h2>{title}</h2>
			{content}
		</div>
	);
};

export default LayoutSubmissionBannerSkeleton;
