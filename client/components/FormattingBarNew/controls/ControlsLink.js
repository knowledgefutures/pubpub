import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { cursor } from '@pubpub/editor';
import { Button, AnchorButton, InputGroup } from '@blueprintjs/core';

const ControlsLink = (props) => {
	const {
		editorChangeObject: { activeLink, view },
		onClose,
	} = props;

	const [href, setHref] = useState(activeLink.attrs.href);
	const [debouncedHref] = useDebounce(href, 250);
	const inputRef = useRef();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => activeLink.updateAttrs({ href: debouncedHref }), [debouncedHref]);

	useEffect(() => {
		if (inputRef.current && typeof inputRef.current.focus === 'function') {
			inputRef.current.focus();
		}
	}, []);

	const restoreSelection = useCallback(() => {
		view.focus();
		cursor.moveToEndOfSelection(view);
	}, [view]);

	const handleKeyPress = (evt) => {
		if (evt.key === 'Enter') {
			activeLink.updateAttrs({ href: href });
			onClose();
			setTimeout(restoreSelection, 0);
		}
	};

	return (
		<div className="controls-link-component">
			<InputGroup
				placeholder="Enter a URL"
				value={href}
				onChange={(evt) => setHref(evt.target.value)}
				onKeyPress={handleKeyPress}
				inputRef={inputRef}
			/>
			<AnchorButton small minimal title="Visit" icon="share" href={href} target="_blank" />
			<Button small minimal title="Remove" icon="disable" onClick={activeLink.removeLink} />
		</div>
	);
};

export default ControlsLink;
