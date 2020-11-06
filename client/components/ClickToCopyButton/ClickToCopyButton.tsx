import React, { useState } from 'react';
import { Tooltip, Button, Position } from '@blueprintjs/core';
import { useCopyToClipboard } from 'react-use';

type OwnProps = {
	afterCopyPrompt?: string;
	beforeCopyPrompt?: string;
	children?: React.ReactNode | ((...args: any[]) => any);
	className?: string;
	copyString: string | ((...args: any[]) => any);
	icon?: string | React.ReactNode;
	minimal?: boolean;
	tooltipPosition?: string;
	usePortal?: boolean;
	small?: boolean;
};

const defaultProps = {
	afterCopyPrompt: 'Copied!',
	beforeCopyPrompt: null,
	children: null,
	className: '',
	icon: 'link',
	minimal: true,
	tooltipPosition: Position.TOP,
	usePortal: true,
};

type Props = OwnProps;

const ClickToCopyButton = (props: Props) => {
	const {
		afterCopyPrompt,
		beforeCopyPrompt,
		children,
		className,
		copyString,
		icon,
		minimal,
		tooltipPosition,
		usePortal,
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
			<Button minimal={minimal} small={small} icon={icon as any} onClick={handleClick}>
				{children}
			</Button>
		);
	};

	return (
		<Tooltip
			usePortal={usePortal}
			content={getTooltipText()}
			onClosed={() => setHasCopied(false)}
			className={className}
			children={renderChildren()}
			position={tooltipPosition as any}
		/>
	);
};
ClickToCopyButton.defaultProps = defaultProps;
export default ClickToCopyButton;
