import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Button, AnchorButton, InputGroup } from '@blueprintjs/core';

const ControlsLink = (props) => {
	const {
		editorChangeObject: { activeLink },
		onClose,
	} = props;

	const [href, setHref] = useState(activeLink.attrs.href);
	const [debouncedHref] = useDebounce(href, 250);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => activeLink.updateAttrs({ href: debouncedHref }), [debouncedHref]);

	const handleKeyPress = (evt) => {
		if (evt.key === 'Enter') {
			activeLink.updateAttrs({ href: href });
			onClose();
		}
	};

	return (
		<div className="controls-link-component">
			<InputGroup
				placeholder="Enter a URL"
				value={href}
				onChange={(evt) => setHref(evt.target.value)}
				onKeyPress={handleKeyPress}
			/>
			<AnchorButton small minimal title="Visit" icon="share" href={href} target="_blank" />
			<Button small minimal title="Remove" icon="disable" onClick={activeLink.removeLink} />
		</div>
	);
};

export default ControlsLink;
