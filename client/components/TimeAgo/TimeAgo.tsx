import React, { useMemo, useState } from 'react';
import ReactTimeAgo from 'react-timeago';
import classNames from 'classnames';

import { formatDate, timeAgoBaseProps } from 'utils/dates';

type Props = {
	date: number | string | Date;
	useDateCutoffDays?: number;
	className?: string;
};

const TimeAgo = (props: Props) => {
	const { className: providedClassName, date: unnormalizedDate, useDateCutoffDays = 7 } = props;
	const [now] = useState(() => new Date());
	const date = useMemo(() => new Date(unnormalizedDate), [unnormalizedDate]);
	const className = classNames('time-ago-component', providedClassName);

	const useCutoff = useMemo(
		() => now.valueOf() - date.valueOf() > 86400 * 1000 * useDateCutoffDays,
		[date, now, useDateCutoffDays],
	);

	if (useCutoff) {
		return (
			<time className={className} dateTime={date.toISOString()}>
				{formatDate(date)}
			</time>
		);
	}
	return <ReactTimeAgo {...timeAgoBaseProps} live={false} date={date} className={className} />;
};

export default TimeAgo;
