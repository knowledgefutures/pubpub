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

type Props = OwnProps & typeof defaultProps;

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
	} = props;
	const [hasCopied, setHasCopied] = useState(false);
	const [copyState, copyToClipboard] = useCopyToClipboard();

	const handleClick = () => {
		// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
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
			// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
			return children(handleClick);
		}
		return (
			// @ts-expect-error ts-migrate(2322) FIXME: Property 'position' does not exist on type 'Intrin... Remove this comment to see the full error message
			<Button minimal={minimal} icon={icon} onClick={handleClick} position={tooltipPosition}>
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
		/>
	);
};
ClickToCopyButton.defaultProps = defaultProps;
export default ClickToCopyButton;
