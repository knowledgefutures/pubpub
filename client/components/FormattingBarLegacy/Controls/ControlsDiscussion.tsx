import React from 'react';
import { Button, ButtonGroup } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';
import DiscussionAutocomplete from './DiscussionAutocomplete';

type Props = {
	attrs: any;
	updateAttrs: (...args: any[]) => any;
	threads: any[];
	isSmall: boolean;
};

const ControlsDiscussion = (props: Props) => {
	const alignOptions = [
		{ key: 'left', icon: 'align-left' },
		{ key: 'center', icon: 'align-center' },
		{ key: 'right', icon: 'align-right' },
		{ key: 'full', icon: 'vertical-distribution' },
	];
	const iconSize = props.isSmall ? 12 : 16;

	return (
		<div className={`formatting-bar_controls-component ${props.isSmall ? 'small' : ''}`}>
			{/*  Alignment Adjustment */}
			<div className="block">
				<div className="label over-buttons">Alignment</div>
				<div className="input">
					<ButtonGroup>
						{alignOptions.map((item) => {
							return (
								<Button
									key={item.key}
									icon={<Icon icon={item.icon} iconSize={iconSize} />}
									minimal={true}
									active={props.attrs.align === item.key}
									onClick={() => {
										props.updateAttrs({ align: item.key });
									}}
								/>
							);
						})}
					</ButtonGroup>
				</div>
			</div>

			{/*  Thread Selection */}
			<div className="block">
				<div className="label">Thread Selection</div>
				<div className="input">
					<DiscussionAutocomplete
						threads={props.threads}
						// @ts-expect-error ts-migrate(2322) FIXME: Type '(thread: any) => void' is not assignable to ... Remove this comment to see the full error message
						onSelect={(thread) => {
							props.updateAttrs({ threadNumber: thread[0].threadNumber });
						}}
						placeholder="Change discussion thread"
					/>
				</div>
			</div>
		</div>
	);
};
export default ControlsDiscussion;
