import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import DiscussionAutocomplete from 'components/DiscussionAddon/DiscussionAutocomplete';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	threads: PropTypes.array.isRequired,
};

const PubSideControlsDiscussion = (props)=> {
	const alignOptions = [
		{ key: 'left', icon: 'bp3-icon-align-left' },
		{ key: 'center', icon: 'bp3-icon-align-center' },
		{ key: 'right', icon: 'bp3-icon-align-right' },
		{ key: 'full', icon: 'bp3-icon-vertical-distribution' },
	];
	return (
		<div className="pub-side-controls-discussion-component">
			<div className="options-title">Discussion Details</div>

			{/*  Alignment Adjustment */}
			<div className="form-label first">
				Alignment
			</div>
			<div className="bp3-button-group bp3-fill">
				{alignOptions.map((item)=> {
					return (
						<Button
							key={`align-option-${item.key}`}
							className={`bp3-button ${item.icon} ${props.attrs.align === item.key ? 'bp3-active' : ''}`}
							onClick={()=> {
								props.updateAttrs({ align: item.key });
							}}
						/>
					);
				})}
			</div>

			{/*  Thread Selection */}
			<div className="form-label">
				Thread Selection
			</div>
			<DiscussionAutocomplete
				threads={props.threads}
				onSelect={(thread)=> {
					props.updateAttrs({ threadNumber: thread[0].threadNumber });
				}}
				placeholder="Change discussion thread"
			/>
		</div>
	);
};

PubSideControlsDiscussion.propTypes = propTypes;
export default PubSideControlsDiscussion;
