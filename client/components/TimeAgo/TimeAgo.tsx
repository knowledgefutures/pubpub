import React, { useMemo, useState } from 'react';
import ReactTimeAgo from 'react-timeago';
import classNames from 'classnames';

import { formatDate, timeAgoBaseProps } from 'utils/dates';

type Props = {
	date: number | string | Date;
	useDateCutoffDays?: number;
	className?: string;
	now?: number | string | Date;
};

const TimeAgo = (props: Props) => {
	const {
		className: providedClassName,
		date: unnormalizedDate,
		now: providedNow,
		useDateCutoffDays = 7,
	} = props;
	const [mountedAt] = useState(() => new Date());
	const date = useMemo(() => new Date(unnormalizedDate), [unnormalizedDate]);
	const className = classNames('time-ago-component', providedClassName);

	const justShowDateInstead = useMemo(() => {
		const nowOrMountedAt = providedNow ?? mountedAt;
		const cutoffMs = 86400 * 1000 * useDateCutoffDays;
		return new Date(nowOrMountedAt).valueOf() - date.valueOf() > cutoffMs;
	}, [date, mountedAt, providedNow, useDateCutoffDays]);

	const nowProps = useMemo(() => {
		if (providedNow) {
			return {
				now: () => providedNow,
			};
		}
		return {};
	}, [providedNow]);

	if (justShowDateInstead) {
		return (
			<time className={className} dateTime={date.toISOString()}>
				{formatDate(date)}
			</time>
		);
	}

	return (
		<ReactTimeAgo
			{...timeAgoBaseProps}
			{...nowProps}
			live={false}
			date={date}
			className={className}
		/>
	);
};

export default TimeAgo;
