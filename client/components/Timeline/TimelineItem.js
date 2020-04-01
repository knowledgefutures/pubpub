import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Icon } from 'components';

import { TimelineContext } from './util';

const propTypes = {
	accentColor: PropTypes.string,
	className: PropTypes.string,
	controls: PropTypes.node,
	hollow: PropTypes.bool,
	large: PropTypes.bool,
	icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
	title: PropTypes.node,
	subtitle: PropTypes.node,
};

const defaultProps = {
	accentColor: null,
	className: '',
	controls: null,
	hollow: false,
	large: false,
	icon: null,
	title: null,
	subtitle: null,
};

const TimelineItem = (props) => {
	const {
		accentColor: localAccentColor,
		className,
		controls,
		hollow,
		large,
		icon,
		title,
		subtitle,
	} = props;
	const { accentColor: contextAccentColor } = useContext(TimelineContext);
	const accentColor = localAccentColor || contextAccentColor;
	return (
		<div
			className={classNames(
				'timeline-item-component',
				large && 'large',
				hollow && 'hollow',
				className,
			)}
		>
			<div className="inner">
				<div className="left">
					<div
						className="bubble"
						style={
							hollow
								? { color: accentColor, borderColor: accentColor }
								: { color: 'white', backgroundColor: accentColor }
						}
					>
						{icon && <Icon icon={icon} iconSize={large ? 20 : 12} />}
					</div>
					<div className="descender" />
				</div>
				<div className="right">
					{title && <div className="title">{title}</div>}
					{subtitle && <div className="subtitle">{subtitle}</div>}
					{controls && <div className="controls">{controls}</div>}
				</div>
			</div>
		</div>
	);
};

TimelineItem.propTypes = propTypes;
TimelineItem.defaultProps = defaultProps;
export default TimelineItem;
