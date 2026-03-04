import React from 'react';

import { usePageContext } from 'utils/hooks';

import './honeypot.scss';

type HoneypotProps = {
	name: string;
};

const Honeypot = (props: HoneypotProps) => {
	const { name } = props;
	const { locationData } = usePageContext();
	const devMode = !locationData.isProd;

	if (devMode) {
		return (
			<label
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: 4,
					fontSize: 11,
					color: 'orange',
					fontWeight: 600,
					padding: '2px 6px',
					border: '1px dashed orange',
					borderRadius: 3,
				}}
			>
				Honeypot
				<input
					type="text"
					name={name}
					autoComplete="off"
					style={{ width: 80, fontSize: 11, padding: '1px 4px' }}
				/>
			</label>
		);
	}

	return (
		<input
			type="text"
			className="honeypot-input"
			name={name}
			tabIndex={-1}
			autoComplete="off"
			aria-hidden="true"
		/>
	);
};

export default Honeypot;
