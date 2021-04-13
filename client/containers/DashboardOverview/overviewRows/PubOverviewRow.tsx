import React from 'react';
import classNames from 'classnames';
import TimeAgo from 'react-timeago';
import { AnchorButton } from '@blueprintjs/core';

import { DefinitelyHas, Pub as BasePub } from 'utils/types';
import { formatDate, timeAgoBaseProps } from 'utils/dates';
import { getPubPublishedDate } from 'utils/pub/pubDates';
import { pubUrl } from 'utils/canonicalUrls';
import { PubByline } from 'components';

import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';
import OverviewRowSkeleton from './OverviewRowSkeleton';

type Pub = DefinitelyHas<BasePub, 'attributions'>;

type Props = {
	leftIconElement?: React.ReactNode;
	rightElement?: React.ReactNode;
	className?: string;
	pub: Pub;
};

const pageLoadTimeMs = Date.now();
const maxTimeagoPeriod = 1000 * 86400 * 7; // one week

const getDateLabel = (date: Date) => {
	if (pageLoadTimeMs - date.valueOf() > maxTimeagoPeriod) {
		return `on ${formatDate(date)}`;
	}
	return <TimeAgo {...timeAgoBaseProps} live={false} date={date} />;
};

const getReleasedStateLabel = (pub: Pub) => {
	const publishedDate = getPubPublishedDate(pub);
	if (publishedDate) {
		return {
			label: <>Published&nbsp;{getDateLabel(publishedDate)}</>,
			icon: 'globe' as const,
		};
	}
	return {
		label: 'Unreleased',
		icon: 'lock2' as const,
	};
};

const PubOverviewRow = (props: Props) => {
	const { pub, className, leftIconElement = null, rightElement: providedRightElement } = props;
	const { communityData } = usePageContext();
	const rightElement = providedRightElement || (
		<AnchorButton
			minimal
			icon="circle-arrow-right"
			href={pubUrl(communityData, pub)}
			target="_blank"
		/>
	);
	return (
		<OverviewRowSkeleton
			className={classNames('pub-overview-row-component', className)}
			href={getDashUrl({ pubSlug: pub.slug })}
			title={pub.title}
			byline={<PubByline pubData={pub} linkToUsers={false} truncateAt={8} />}
			iconLabelPairs={[getReleasedStateLabel(pub)]}
			leftIcon={leftIconElement || 'pubDoc'}
			rightElement={rightElement}
		/>
	);
};

export default PubOverviewRow;
