import React, { useState } from 'react';
import { ControlGroup, InputGroup } from '@blueprintjs/core';

import { MenuButton, MenuItem } from 'components/Menu';
import { usePubContext } from 'client/containers/Pub/pubHooks';

type Props = {
	customLabel: string;
	defaultLabel: string;
	onUpdateCustomLabel: (...args: any[]) => any;
};

const InlineLabelEditor = (props: Props) => {
	const { customLabel, defaultLabel, onUpdateCustomLabel } = props;
	const { inPub } = usePubContext();
	const [usingCustomLabel, setUsingCustomLabel] = useState(!!customLabel);
	const defaultText = inPub ? 'Pub Default' : 'Default';
	const buttonLabel = usingCustomLabel ? 'Custom' : defaultText;

	const handleSelectDefault = () => {
		setUsingCustomLabel(false);
		onUpdateCustomLabel('');
	};

	const handleSelectCustom = () => {
		if (!customLabel) onUpdateCustomLabel(defaultLabel);
		setUsingCustomLabel(true);
	};

	return (
		<ControlGroup className="inline-label-editor-component">
			<MenuButton
				aria-label="Choose an inline label type"
				buttonProps={{
					minimal: true,
					rightIcon: 'chevron-down',
					className: 'label-type-menu',
				}}
				buttonContent={buttonLabel}
			>
				<MenuItem text={defaultText} onClick={handleSelectDefault} />
				<MenuItem text="Custom" onClick={handleSelectCustom} />
			</MenuButton>
			<InputGroup
				disabled={!usingCustomLabel}
				value={usingCustomLabel ? customLabel : defaultLabel}
				onChange={(evt) => onUpdateCustomLabel(evt.target.value)}
			/>
		</ControlGroup>
	);
};
export default InlineLabelEditor;
