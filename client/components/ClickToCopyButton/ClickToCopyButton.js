import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Button, Position } from '@blueprintjs/core';
import { useCopyToClipboard } from 'react-use';

const propTypes = {
	afterCopyPrompt: PropTypes.string,
	beforeCopyPrompt: PropTypes.string,
	children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
	className: PropTypes.string,
	copyString: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
	icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
	tooltipPosition: PropTypes.string,
};

const defaultProps = {
	afterCopyPrompt: 'Copied!',
	beforeCopyPrompt: null,
	icon: 'link',
	children: null,
	className: '',
	tooltipPosition: Position.TOP,
};

const ClickToCopyButton = (props) => {
	const {
		afterCopyPrompt,
		beforeCopyPrompt,
		children,
		className,
		copyString,
		icon,
		tooltipPosition,
	} = props;
	const [hasCopied, setHasCopied] = useState(false);
	const [copyState, copyToClipboard] = useCopyToClipboard();

	const handleClick = () => {
		copyToClipboard(typeof copyString === 'function' ? copyString() : copyString);
		setHasCopied(true);
	};

	const getTooltipText = () => {
		if (hasCopied) {
			if (copyState.error) {
				return 'There was an error copying.';
			}
			return afterCopyPrompt;
		}
		return beforeCopyPrompt;
	};

	const renderChildren = () => {
		if (typeof children === 'function') {
			return children(handleClick);
		}
		return (
			<Button minimal icon={icon} onClick={handleClick} position={tooltipPosition}>
				{children}
			</Button>
		);
	};

	return (
		<Tooltip
			content={getTooltipText()}
			onClosed={() => setHasCopied(false)}
			className={className}
			children={renderChildren()}
		/>
	);
};

ClickToCopyButton.propTypes = propTypes;
ClickToCopyButton.defaultProps = defaultProps;
export default ClickToCopyButton;
