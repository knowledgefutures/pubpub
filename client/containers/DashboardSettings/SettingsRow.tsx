import React from 'react';

require('./settingsRow.scss');

type Props = {
	children: React.ReactNode;
	gap?: number;
};

const SettingsRow = (props: Props) => {
	const { children, gap = 10 } = props;
	return (
		<div className="settings-row-component" style={gap ? { gap } : {}}>
			{children}
		</div>
	);
};

export default SettingsRow;
