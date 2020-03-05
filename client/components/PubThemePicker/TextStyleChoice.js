import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import PubHeaderBackground from 'containers/Pub/PubHeader/PubHeaderBackground';

const propTypes = {
	className: PropTypes.string,
	communityData: PropTypes.object.isRequired,
	label: PropTypes.node.isRequired,
	onClick: PropTypes.func.isRequired,
	pubData: PropTypes.object.isRequired,
	selected: PropTypes.bool,
	style: PropTypes.object,
};
const defaultProps = {
	className: PropTypes.string,
	selected: false,
	style: {},
};

const TextStyleChoice = React.forwardRef(
	({ label, className, onClick, selected, style, pubData, communityData }, ref) => {
		return (
			<Button
				className={classNames('text-style-choice')}
				onClick={onClick}
				ref={ref}
				title={label}
			>
				<PubHeaderBackground
					pubData={pubData}
					communityData={communityData}
					blur={true}
					className={classNames(
						'example',
						className,
						'selectable',
						selected && 'selected',
					)}
					style={style || {}}
				>
					<div className="example-text">Aa</div>
				</PubHeaderBackground>
				<div className="label">{label}</div>
			</Button>
		);
	},
);

TextStyleChoice.propTypes = propTypes;
TextStyleChoice.defaultProps = defaultProps;
export default TextStyleChoice;
