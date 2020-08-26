import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import { Icon } from 'components';

require('./largeHeaderButton.scss');

const propTypes = {
	active: PropTypes.bool,
	className: PropTypes.string,
	disabled: PropTypes.bool,
	icon: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
	label: PropTypes.oneOfType([
		PropTypes.shape({
			top: PropTypes.node,
			bottom: PropTypes.node,
		}),
		PropTypes.node,
	]),
	onClick: PropTypes.func,
	outerLabel: PropTypes.oneOfType([
		PropTypes.shape({
			top: PropTypes.node,
			bottom: PropTypes.node,
		}),
		PropTypes.node,
	]),
	showCaret: PropTypes.bool,
	tagName: PropTypes.string,
};

const defaultProps = {
	active: false,
	className: '',
	disabled: false,
	icon: null,
	label: undefined,
	onClick: null,
	outerLabel: undefined,
	showCaret: false,
	tagName: 'button',
};

const LargeHeaderButton = React.forwardRef((props, ref) => {
	const {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'active' does not exist on type '{ childr... Remove this comment to see the full error message
		active,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'className' does not exist on type '{ chi... Remove this comment to see the full error message
		className,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'disabled' does not exist on type '{ chil... Remove this comment to see the full error message
		disabled,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'icon' does not exist on type '{ children... Remove this comment to see the full error message
		icon,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'label' does not exist on type '{ childre... Remove this comment to see the full error message
		label,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'onClick' does not exist on type '{ child... Remove this comment to see the full error message
		onClick,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'outerLabel' does not exist on type '{ ch... Remove this comment to see the full error message
		outerLabel,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'showCaret' does not exist on type '{ chi... Remove this comment to see the full error message
		showCaret,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'tagName' does not exist on type '{ child... Remove this comment to see the full error message
		tagName,
		...restProps
	} = props;
	const hasStackedLabel = label && label.top && label.bottom;
	const hasStackedOuterLabel = outerLabel && outerLabel.top && outerLabel.bottom;
	return (
		<Button
			disabled={disabled}
			as={tagName}
			className={classNames(
				'large-header-button-component',
				'pub-header-themed-box-hover-target',
				className,
			)}
			onClick={onClick}
			ref={ref}
			{...restProps}
		>
			<div
				className={classNames(
					'button-box',
					'pub-header-themed-box',
					!label && 'no-label',
					active && 'active',
				)}
			>
				{typeof icon === 'string' ? <Icon icon={icon} iconSize={22} /> : icon}
				{showCaret && <Icon icon="caret-down" className="caret" iconSize={10} />}
				{label && !hasStackedLabel && <div className="label">{label}</div>}
				{hasStackedLabel && (
					<div className="stacked-label">
						<div className="top">{label.top}</div>
						<div className="bottom pub-header-themed-secondary">{label.bottom}</div>
					</div>
				)}
			</div>
			{outerLabel && !hasStackedOuterLabel && <div className="outer-label">{outerLabel}</div>}
			{hasStackedOuterLabel && (
				<div className="outer-label">
					<div className="top pub-header-themed-secondary">{outerLabel.top}</div>
					<div className="bottom">{outerLabel.bottom}</div>
				</div>
			)}
		</Button>
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ active: Requireable<boolean>; className: R... Remove this comment to see the full error message
LargeHeaderButton.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ active: boolean; className: string; disabl... Remove this comment to see the full error message
LargeHeaderButton.defaultProps = defaultProps;
export default LargeHeaderButton;
