import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import { Icon } from 'components';

const alignOptions = [
	{ key: 'left', icon: 'align-left' },
	{ key: 'center', icon: 'align-center' },
	{ key: 'right', icon: 'align-right' },
	{ key: 'full', icon: 'vertical-distribution' },
	{ key: 'breakout', icon: 'fullscreen' },
];

const AlignmentControl = (props) => {
	const { isSmall, onChange, value } = props;
	return (
		<div className="alignment-control">
			<div className="left-label">Alignment</div>
			<div className="controls">
				{alignOptions.map((item) => {
					return (
						<Button
							aria-label={item.key}
							aria-selected={value === item.key}
							key={item.key}
							icon={<Icon icon={item.icon} iconSize={isSmall ? 12 : 16} />}
							minimal={true}
							active={value === item.key}
							onClick={() => onChange(item.key)}
						/>
					);
				})}
			</div>
		</div>
	);
};

AlignmentControl.propTypes = {
	onChange: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
	value: PropTypes.string.isRequired,
};

export default AlignmentControl;
