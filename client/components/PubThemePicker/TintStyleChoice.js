import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

const propTypes = {
	color: PropTypes.string.isRequired,
	label: PropTypes.node.isRequired,
	onClick: PropTypes.func,
	selected: PropTypes.bool,
};

const defaultProps = {
	onClick: null,
	selected: false,
};

const TintStyleChoice = React.forwardRef(({ label, onClick, color, selected }, ref) => {
	return (
		<Button className="tint-choice" onClick={onClick} ref={ref} title={label}>
			<div className="example">
				<div className="transparency" />
				<div
					className={classNames('inner', 'selectable', selected && 'selected')}
					style={{ backgroundColor: color }}
				/>
			</div>
			<div className="label">{label}</div>
		</Button>
	);
});

TintStyleChoice.propTypes = propTypes;
TintStyleChoice.defaultProps = defaultProps;
export default TintStyleChoice;
