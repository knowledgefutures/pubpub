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

// @ts-expect-error ts-migrate(2339) FIXME: Property 'label' does not exist on type '{ childre... Remove this comment to see the full error message
const TintStyleChoice = React.forwardRef(({ label, onClick, color, selected }, ref) => {
	return (
		// @ts-expect-error ts-migrate(2769) FIXME: Type 'unknown' is not assignable to type 'HTMLButt... Remove this comment to see the full error message
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

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ color: Validator<string>; label: Validator... Remove this comment to see the full error message
TintStyleChoice.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ onClick: null; selected: boolean; }' has n... Remove this comment to see the full error message
TintStyleChoice.defaultProps = defaultProps;
export default TintStyleChoice;
