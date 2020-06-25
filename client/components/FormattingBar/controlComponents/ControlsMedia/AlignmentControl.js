import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { Radio, RadioGroup, useRadioState } from 'reakit';

import { Icon } from 'components';

const propTypes = {
	onChange: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
	value: PropTypes.string.isRequired,
};

const alignOptions = [
	{ key: 'left', icon: 'align-left' },
	{ key: 'center', icon: 'align-center' },
	{ key: 'right', icon: 'align-right' },
	{ key: 'full', icon: 'vertical-distribution' },
	{ key: 'breakout', icon: 'fullscreen' },
];

const AlignmentControl = (props) => {
	const { isSmall, onChange, value } = props;
	const radio = useRadioState();
	return (
		<div className="controls-row">
			<div className="left-label">Alignment</div>
			<RadioGroup className="controls" aria-label="Figure alignment" as="div">
				{alignOptions.map((item) => {
					return (
						<Radio
							{...radio}
							aria-label={item.key}
							key={item.key}
							checked={value === item.key}
							onClick={() => onChange(item.key)}
						>
							{({ ref, ...restRadioProps }) => (
								<Button
									elementRef={ref}
									icon={<Icon icon={item.icon} iconSize={isSmall ? 12 : 16} />}
									minimal={true}
									aria-label={item.key}
									active={value === item.key}
									{...restRadioProps}
								/>
							)}
						</Radio>
					);
				})}
			</RadioGroup>
		</div>
	);
};

AlignmentControl.propTypes = propTypes;
export default AlignmentControl;
