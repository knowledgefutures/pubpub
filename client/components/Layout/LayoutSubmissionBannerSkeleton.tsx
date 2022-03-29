import React from 'react';
import Color from 'color';
import classNames from 'classnames';

import { usePageContext } from 'utils/hooks';

require('./layoutSubmissionBannerSkeleton.scss');

type Props = {
	className?: string;
	title: React.ReactNode;
	content: React.ReactNode;
};

const LayoutSubmissionBannerSkeleton = (props: Props) => {
	const { title, content, className } = props;
	const {
		communityData: { accentColorDark },
	} = usePageContext();

	const backgroundColor = Color(accentColorDark).alpha(0.2).toString();

	return (
		<div
			className={classNames('layout-submission-banner-skeleton-component', className)}
			style={{ backgroundColor }}
		>
			<h2>{title}</h2>
			<div>{content}</div>
		</div>
	);
};

export default LayoutSubmissionBannerSkeleton;
