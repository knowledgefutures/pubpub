import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@blueprintjs/core';

require('./discussionBubble.scss');

const propTypes = {
	color: PropTypes.string.isRequired,
	count: PropTypes.node,
	isActive: PropTypes.bool.isRequired,
	label: PropTypes.node,
	onMouseEnter: PropTypes.func,
	onMouseLeave: PropTypes.func,
	onClick: PropTypes.func,
	showDot: PropTypes.bool.isRequired,
};

const defaultProps = {
	count: null,
	label: null,
	onClick: null,
	onMouseEnter: null,
	onMouseLeave: null,
};

const DiscussionBubble = (props) => {
	const { color, count, isActive, label, onClick, onMouseEnter, onMouseLeave, showDot } = props;
	const accentStyleBubble = {
		border: `1px solid ${color}`,
	};
	const accentStyleBubbleActive = {
		border: `1px solid ${color}`,
		background: color,
		color: 'white',
	};
	const bubbleStyle = isActive ? accentStyleBubbleActive : accentStyleBubble;
	return (
		<span
			className="discussion-bubble-component"
			role="button"
			tabIndex={0}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onClick={onClick}
		>
			<span className="bubble" style={bubbleStyle}>
				{count || <Icon icon="dot" color={isActive ? 'white' : color} />}
				{showDot && (
					<span
						className="bubble-dot"
						style={{
							border: `1px solid ${color}`,
						}}
					/>
				)}
			</span>
			{label && <span className="label">{label}</span>}
		</span>
	);
};

DiscussionBubble.propTypes = propTypes;
DiscussionBubble.defaultProps = defaultProps;
export default DiscussionBubble;
