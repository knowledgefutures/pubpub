import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit';

import PubHeaderBackground from 'containers/Pub/PubHeader/PubHeaderBackground';

type Props = {
	className?: string;
	communityData: any;
	label: React.ReactNode;
	onClick: (...args: any[]) => any;
	pubData: any;
	selected?: boolean;
	style?: any;
};
const defaultProps = {
	className: PropTypes.string,
	selected: false,
	style: {},
};

const TextStyleChoice = React.forwardRef<any, Props>(
	({ label, className, onClick, selected, style, pubData, communityData }, ref) => {
		return (
			// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
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
// @ts-expect-error ts-migrate(2322) FIXME: Type '{ className: PropTypes.Requireable<string>; ... Remove this comment to see the full error message
TextStyleChoice.defaultProps = defaultProps;
export default TextStyleChoice;
