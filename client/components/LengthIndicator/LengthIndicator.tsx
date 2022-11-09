import React from 'react';
import { Text } from '@blueprintjs/core';
import classNames from 'classnames';

require('./lengthIndicator.scss');

export type LengthIndicatorProps = {
	length: number;
	maxLength: number;
	visibilityThreshold?: number;
};

const LengthIndicator = (props: LengthIndicatorProps) => {
	const { length, maxLength, visibilityThreshold = 0.9 } = props;
	const lengthRatio = length / maxLength;
	const showLengthIndicator = lengthRatio > visibilityThreshold;

	if (!showLengthIndicator) {
		return null;
	}

	return (
		<Text
			className={classNames(
				'length-indicator-component',
				lengthRatio === 1 && 'at-max-length',
			)}
		>
			{length} / {maxLength}
		</Text>
	);
};

export default LengthIndicator;
