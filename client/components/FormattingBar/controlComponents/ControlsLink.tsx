import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { moveToEndOfSelection } from 'components/Editor';
import { Button, AnchorButton, InputGroup } from '@blueprintjs/core';

type Props = {
	editorChangeObject: {
		activeLink?: any;
		view?: any;
	};
	onClose: (...args: any[]) => any;
};

const ControlsLink = (props: Props) => {
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
		// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
		if (inputRef.current && typeof inputRef.current.focus === 'function' && !href) {
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
				inputRef={inputRef}
			/>
			<AnchorButton small minimal title="Visit" icon="share" href={href} target="_blank" />
			<Button small minimal title="Remove" icon="disable" onClick={activeLink.removeLink} />
		</div>
	);
};
export default ControlsLink;
