import React from 'react';

import classNames from 'classnames';
import Color from 'color';

import { usePageContext } from 'utils/hooks';

import './layoutSubmissionBannerSkeleton.scss';

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
