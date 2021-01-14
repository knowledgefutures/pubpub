import React, { useState } from 'react';
import { Tooltip, Button, Position } from '@blueprintjs/core';
import { useCopyToClipboard } from 'react-use';

type ClickHandler = () => unknown;

type Props = {
	afterCopyPrompt?: string;
	beforeCopyPrompt?: string;
	children?: React.ReactNode | ((handleClick: ClickHandler) => unknown);
	className?: string;
	copyString: string | (() => string);
	disabled?: boolean;
	icon?: string | React.ReactNode;
	minimal?: boolean;
	tooltipPosition?: string;
	usePortal?: boolean;
	small?: boolean;
};

const ClickToCopyButton = (props: Props) => {
	const {
		afterCopyPrompt = 'Copied!',
		beforeCopyPrompt = null,
		children = null,
		className = '',
		copyString,
		disabled = false,
		icon = 'link',
		minimal = true,
		tooltipPosition = Position.TOP,
		usePortal = true,
		small = false,
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
			<Button
				minimal={minimal}
				small={small}
				icon={icon as any}
				onClick={handleClick}
				disabled={disabled}
			>
				{children}
			</Button>
		);
	};

	return (
		<Tooltip
			usePortal={usePortal}
			content={getTooltipText() || undefined}
			onClosed={() => setHasCopied(false)}
			className={className}
			children={renderChildren()}
			position={tooltipPosition as any}
		/>
	);
};

export default ClickToCopyButton;
