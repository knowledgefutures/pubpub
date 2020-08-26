import React from 'react';
import classNames from 'classnames';

import { TimelineContext } from './util';

require('./timeline.scss');

type OwnProps = {
	accentColor?: string;
	children: React.ReactNode;
	className?: string;
};

const defaultProps = {
	accentColor: null,
	className: '',
};

type Props = OwnProps & typeof defaultProps;

const Timeline = (props: Props) => {
	const { accentColor, children, className } = props;
	return (
		<div className={classNames('timeline-component', className)}>
			<TimelineContext.Provider value={{ accentColor: accentColor }}>
				{children}
			</TimelineContext.Provider>
		</div>
	);
};
Timeline.defaultProps = defaultProps;
export default Timeline;
