import React from 'react';
import { Icon } from '@blueprintjs/core';

require('./discussionBubble.scss');

type OwnProps = {
	color: string;
	count?: React.ReactNode;
	isActive: boolean;
	label?: React.ReactNode;
	onMouseEnter?: (...args: any[]) => any;
	onMouseLeave?: (...args: any[]) => any;
	onClick?: (...args: any[]) => any;
	showDot: boolean;
};

const defaultProps = {
	count: null,
	label: null,
	onClick: null,
	onMouseEnter: null,
	onMouseLeave: null,
};

type Props = OwnProps & typeof defaultProps;

const DiscussionBubble = (props: Props) => {
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
DiscussionBubble.defaultProps = defaultProps;
export default DiscussionBubble;
