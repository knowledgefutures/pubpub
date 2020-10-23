import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { slugifyString } from 'utils/strings';

require('./settingsSection.scss');

type Props = {
	className?: string;
	title: React.ReactNode;
	id?: string;
	children: React.ReactNode;
};

const SettingsSection = (props: Props) => {
	const { className, title, id, children } = props;
	const [emphasized, setEmphasized] = useState(false);

	useEffect(() => {
		if (window && id && id === window.location.hash.slice(1)) {
			setEmphasized(true);
		}
	}, [id]);

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			onClick={() => setEmphasized(false)}
			className={classNames(
				'settings-section-component',
				emphasized && 'emphasized',
				className,
			)}
			id={id || slugifyString(props.title)}
		>
			<div className="title">{title}</div>
			<div className="content">{children}</div>
		</div>
	);
};

export default SettingsSection;
