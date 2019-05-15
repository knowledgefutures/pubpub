import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Tooltip, Button, Position } from '@blueprintjs/core';
import { useCopyToClipboard } from 'react-use';

const propTypes = {
	afterCopyPrompt: PropTypes.string,
	beforeCopyPrompt: PropTypes.string.isRequired,
	children: PropTypes.node,
	className: PropTypes.string,
	copyString: PropTypes.string.isRequired,
	icon: PropTypes.oneOf([PropTypes.string, PropTypes.node]),
	tooltipPosition: PropTypes.string,
};

const defaultProps = {
	afterCopyPrompt: 'Copied!',
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
		copyToClipboard(copyString);
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

	return (
		<Tooltip
			content={getTooltipText()}
			onClosed={() => setHasCopied(false)}
			className={className}
		>
			<Button minimal icon={icon} onClick={handleClick} position={tooltipPosition}>
				{children}
			</Button>
		</Tooltip>
	);
};

ClickToCopyButton.propTypes = propTypes;
ClickToCopyButton.defaultProps = defaultProps;
export default ClickToCopyButton;
