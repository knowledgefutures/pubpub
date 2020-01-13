import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';
import DiscussionAutocomplete from './DiscussionAutocomplete';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	threads: PropTypes.array.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

const ControlsDiscussion = (props) => {
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

ControlsDiscussion.propTypes = propTypes;
export default ControlsDiscussion;
