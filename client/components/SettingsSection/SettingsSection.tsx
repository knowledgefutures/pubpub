import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { slugifyString } from 'utils/strings';

require('./settingsSection.scss');

type Props = {
	className?: string;
	title: React.ReactNode;
	id?: string;
	children: React.ReactNode;
	compact?: boolean;
	gradient?: boolean;
	showTitle?: boolean;
	controls?: React.ReactNode;
	description?: React.ReactNode;
	collapseDescription?: boolean;
};

const SettingsSection = (props: Props) => {
	const {
		className,
		title,
		id,
		children,
		gradient = false,
		compact = false,
		showTitle = true,
		description,
		collapseDescription = false,
		controls = null,
	} = props;
	const [emphasized, setEmphasized] = useState(false);

	useEffect(() => {
		if (window && id && id === window.location.hash.slice(1)) {
			setEmphasized(true);
		}
	}, [id]);

	const descriptionNode =
		description &&
		(collapseDescription ? (
			<details className="description">
				<summary>Description</summary>
				{description}
			</details>
		) : (
			<div className="description">{description}</div>
		));

	return (
		<div
			id={id || slugifyString(title)}
			role="none"
			onClick={() => setEmphasized(false)}
			className={classNames(
				'settings-section-component',
				compact && 'compact',
				emphasized && 'emphasized',
				className,
			)}
		>
			{gradient && <div className="gradient" />}
			{showTitle && (
				<div className="title-area">
					<div className="title-row">
						<div className="title">{title}</div>
						{controls}
					</div>
					{descriptionNode}
				</div>
			)}
			<div className="content">{children}</div>
		</div>
	);
};

export default SettingsSection;
