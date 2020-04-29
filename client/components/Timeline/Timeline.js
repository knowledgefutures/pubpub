import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { TimelineContext } from './util';

require('./timeline.scss');

const propTypes = {
	accentColor: PropTypes.string,
	children: PropTypes.node.isRequired,
	className: PropTypes.string,
};

const defaultProps = {
	accentColor: null,
	className: '',
};

const Timeline = (props) => {
	const { accentColor, children, className } = props;
	return (
		<div className={classNames('timeline-component', className)}>
			<TimelineContext.Provider value={{ accentColor: accentColor }}>
				{children}
			</TimelineContext.Provider>
		</div>
	);
};

Timeline.propTypes = propTypes;
Timeline.defaultProps = defaultProps;
export default Timeline;
