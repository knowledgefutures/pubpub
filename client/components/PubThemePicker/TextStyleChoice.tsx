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
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'label' does not exist on type '{ childre... Remove this comment to see the full error message
	({ label, className, onClick, selected, style, pubData, communityData }, ref) => {
		return (
			// @ts-expect-error ts-migrate(2769) FIXME: Type 'unknown' is not assignable to type 'HTMLButt... Remove this comment to see the full error message
			<Button
				className={classNames('text-style-choice')}
				onClick={onClick}
				ref={ref}
				title={label}
			>
				{/* @ts-expect-error ts-migrate(2322) FIXME: Property 'children' does not exist on type 'Intrin... Remove this comment to see the full error message */}
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

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ className: Requireable<string>; communityD... Remove this comment to see the full error message
TextStyleChoice.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ className: Requireable<string>; selected: ... Remove this comment to see the full error message
TextStyleChoice.defaultProps = defaultProps;
export default TextStyleChoice;
