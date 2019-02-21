import React from 'react';
import PropTypes from 'prop-types';
import { Button, AnchorButton } from '@blueprintjs/core';

require('./pubLinkMenu.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
	getAbsolutePosition: PropTypes.func.isRequired,
};

const PubLinkMenu = (props) => {
	const activeLink = props.editorChangeObject.activeLink || {};
	const isReadOnly =
		!props.pubData.isDraft || (!props.pubData.isManager && !props.pubData.isDraftEditor);
	if (isReadOnly || !activeLink.attrs) {
		return null;
	}

	const menuStyle = {
		position: 'absolute',
		...props.getAbsolutePosition(activeLink.boundingBox.bottom, activeLink.boundingBox.left),
	};

	return (
		<div className="pub-link-menu-component bp3-elevation-2" style={menuStyle}>
			<input
				ref={(elem) => {
					if (elem) {
						elem.focus();
					}
				}}
				className="bp3-input"
				type="text"
				value={activeLink.attrs.href}
				onChange={(evt) => {
					activeLink.updateAttrs({ href: evt.target.value });
				}}
			/>
			<AnchorButton
				minimal={true}
				href={activeLink.attrs.href}
				target="_blank"
				rel="noopener noreferrer"
				text="Go To Link"
				icon="share"
				disabled={!activeLink.attrs.href}
			/>
			<Button minimal={true} text="Remove" onClick={activeLink.removeLink} icon="delete" />
		</div>
	);
};

PubLinkMenu.propTypes = propTypes;
export default PubLinkMenu;
