import React from 'react';
import PropTypes from 'prop-types';
import { Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';

require('./layoutEditorInsert.scss');

const propTypes = {
	insertIndex: PropTypes.number.isRequired,
	onInsert: PropTypes.func.isRequired,
};

const LayoutEditorInsert = function(props) {
	const insertIndex = props.insertIndex;
	const onInsert = props.onInsert;
	const types = [
		{ title: 'Add Pub List', type: 'pubs' },
		{ title: 'Add Text Block', type: 'text' },
		{ title: 'Add HTML Block', type: 'html' },
		{ title: 'Add Banner Block', type: 'banner' },
	];
	return (
		<div className="layout-editor-insert-component">
			<Popover
				content={
					<div className="pt-menu">
						{types.map((item)=> {
							return (
								<div
									role="button"
									tabIndex={-1}
									key={`insert-${item.type}`}
									className="pt-menu-item pt-popover-dismiss"
									onClick={()=>{ onInsert(insertIndex, item.type); }}
								>
									{item.title}
								</div>
							);
						})}
					</div>
				}
				interactionKind={PopoverInteractionKind.CLICK}
				position={Position.BOTTOM}
				popoverClassName="pt-minimal"
				transitionDuration={-1}
				inheritDarkTheme={false}
			>
				<button type="button" className="pt-button pt-icon-add">Add Section</button>
			</Popover>
			<div className="center-line" />
		</div>
	);
};

LayoutEditorInsert.propTypes = propTypes;
export default LayoutEditorInsert;
