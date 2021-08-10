import React, { useState } from 'react';
import { InputGroup, AnchorButton } from '@blueprintjs/core';

type Props = {
	onChange: (href: string) => unknown;
	value: string;
};

const UrlControl = (props: Props) => {
	const [href, setHref] = useState(props.value);
	return (
		<div className="controls-row">
			<div className="left-label">Link to</div>
			<InputGroup
				fill
				value={href}
				onBlur={() => props.onChange(href)}
				placeholder="https://example.com"
				onChange={(evt) => setHref(evt.target.value)}
				onKeyPress={(evt) => {
					if (evt.key === 'Enter') {
						props.onChange(href);
					}
				}}
			/>
			<AnchorButton minimal title="Visit" icon="share" href={href} target="_blank" />
		</div>
	);
};

export default UrlControl;
