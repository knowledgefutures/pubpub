import React from 'react';
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

const TextStyleChoice = React.forwardRef((props: Props, ref) => {
	const {
		label,
		className,
		onClick,
		selected = false,
		style = {},
		pubData,
		communityData,
	} = props;
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
				className={classNames('example', className, 'selectable', selected && 'selected')}
				style={style || {}}
			>
				<div className="example-text">Aa</div>
			</PubHeaderBackground>
			<div className="label">{label}</div>
		</Button>
	);
});

export default TextStyleChoice;
