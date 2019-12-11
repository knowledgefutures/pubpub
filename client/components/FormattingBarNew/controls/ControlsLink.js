import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

const ControlsLink = (props) => {
	const {
		editorChangeObject: { activeLink },
	} = props;

	const [href, setHref] = useState(activeLink.attrs.href);
	const [debouncedHref] = useDebounce(href, 250);

	useEffect(() => activeLink.updateAttrs({ href: debouncedHref }), [activeLink, debouncedHref]);

	return (
		<div className="controls-link-component">
			<input type="text" value={href} onChange={(evt) => setHref(evt.target.value)} />
		</div>
	);
};

export default ControlsLink;
