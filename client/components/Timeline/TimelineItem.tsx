import React, { useContext } from 'react';
import classNames from 'classnames';

import { Icon } from 'components';

import { TimelineContext } from './util';

type OwnProps = {
	accentColor?: string;
	className?: string;
	controls?: React.ReactNode;
	hollow?: boolean;
	large?: boolean;
	icon?: string | React.ReactNode;
	title?: React.ReactNode;
	subtitle?: React.ReactNode;
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

type Props = OwnProps & typeof defaultProps;

const TimelineItem = (props: Props) => {
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
TimelineItem.defaultProps = defaultProps;
export default TimelineItem;
