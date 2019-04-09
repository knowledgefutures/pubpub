import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon as BlueprintIcon } from '@blueprintjs/core';

import customIcons from './customIcons';

require('./icon.scss');

const propTypes = {
	className: PropTypes.string,
	icon: PropTypes.string.isRequired,
	iconSize: PropTypes.number,
	useColor: PropTypes.bool,
};

const defaultProps = {
	className: null,
	iconSize: 16,
	useColor: false,
};

const Icon = function(props) {
	if (customIcons[props.icon]) {
		const viewbox = customIcons[props.icon].viewboxDefault;
		return (
			<span
				className={classNames('bp3-icon', props.useColor && 'color', props.className)}
				data-icon={props.icon.toLowerCase().replace(/_/gi, '-')}
			>
				<svg
					width={`${props.iconSize}px`}
					height={`${props.iconSize}px`}
					viewBox={`0 0 ${viewbox} ${viewbox}`}
				>
					{customIcons[props.icon].path}
				</svg>
			</span>
		);
	}

	return (
		<BlueprintIcon icon={props.icon} iconSize={props.iconSize} className={props.className} />
	);
};

Icon.propTypes = propTypes;
Icon.defaultProps = defaultProps;
export default Icon;
