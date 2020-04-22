import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';
import { moveToEndOfSelection } from 'components/Editor';
import { Button, AnchorButton, InputGroup } from '@blueprintjs/core';

const propTypes = {
	editorChangeObject: PropTypes.shape({
		activeLink: PropTypes.object,
		view: PropTypes.object,
	}).isRequired,
	onClose: PropTypes.func.isRequired,
};

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
		if (inputRef.current && typeof inputRef.current.focus === 'function' && !href) {
			inputRef.current.focus();
		}
	}, [href]);

	const restoreSelection = useCallback(() => {
		view.focus();
		moveToEndOfSelection(view);
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

ControlsLink.propTypes = propTypes;
export default ControlsLink;
