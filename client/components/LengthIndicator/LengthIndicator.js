import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Text } from '@blueprintjs/core';

require('./lengthIndicator.scss');

const propTypes = {
	length: PropTypes.number.isRequired,
	maxLength: PropTypes.number.isRequired,
	visibilityThreshold: PropTypes.number,
};

const defaultProps = {
	visibilityThreshold: 0.9,
};

function LengthIndicator(props) {
	const { length, maxLength, visibilityThreshold } = props;
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
}

LengthIndicator.propTypes = propTypes;
LengthIndicator.defaultProps = defaultProps;
export default LengthIndicator;
