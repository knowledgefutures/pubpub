import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'components/Icon/Icon';
import { Button, Tooltip, Spinner, Menu, MenuItem, Popover, Position, PopoverInteractionKind } from '@blueprintjs/core';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import FormattingBarControls from 'components/FormattingBarControls/FormattingBarControls';
import FormattingBarMedia from 'components/FormattingBarMedia/FormattingBarMedia';
import Overlay from 'components/Overlay/Overlay';

require('./formattingBar.scss');

const propTypes = {
	editorChangeObject: PropTypes.object.isRequired,
	hideMedia: PropTypes.bool,
	hideBlocktypes: PropTypes.bool,
	hideExtraFormatting: PropTypes.bool,
	isSmall: PropTypes.bool,
	threads: PropTypes.array,
};

const defaultProps = {
	hideMedia: false,
	hideBlocktypes: false,
	hideExtraFormatting: false,
	isSmall: false,
	threads: [],
};

class FormattingBar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			mediaGalleryOpen: false,
		};
		this.closeMediaGallery = this.closeMediaGallery.bind(this);
	}

	closeMediaGallery() {
		this.setState({ mediaGalleryOpen: false }, ()=> {
			this.props.editorChangeObject.view.focus();
		});
	}

	render () {
		const menuItems = this.props.editorChangeObject.menuItems || [];
		const menuItemsObject = menuItems.reduce((prev, curr)=> {
			return { ...prev, [curr.title]: curr };
		}, {});

		const blockTypeItems = [
			{ key: 'paragraph', 	title: 'Paragraph',		icon: 'git-merge' },
			{ key: 'header1', 		title: 'Header 1', 		icon: 'header-one' },
			{ key: 'header2', 		title: 'Header 2', 		icon: 'header-two' },
			{ key: 'header3', 		title: 'Header 3', 		icon: 'comparison' },
			{ key: 'code_block', 	title: 'Code Block', 	icon: 'code' },
		];

		const formattingItems = [
			{ key: 'strong', 		title: 'Bold', 			icon: 'bold', priority: true },
			{ key: 'em', 			title: 'Italic', 		icon: 'italic', priority: true },
			{ key: 'code', 			title: 'Code', 			icon: 'code' },
			{ key: 'subscript', 	title: 'Subscript', 	icon: 'subscript' },
			{ key: 'superscript', 	title: 'Superscript', 	icon: 'superscript' },
			{ key: 'strikethrough', title: 'Strikethrough', icon: 'strikethrough' },
			{ key: 'blockquote', 	title: 'Blockquote', 	icon: 'citation' },
			{ key: 'bullet-list', 	title: 'Bullet List', 	icon: 'list-ul' },
			{ key: 'numbered-list', title: 'Numbered List', icon: 'list-ol' },
			{ key: 'link', 			title: 'Link', 			icon: 'link', priority: true },
		].filter((item)=> {
			return !this.props.hideExtraFormatting || item.priority;
		});

		const insertItems = [
			{ key: 'citation', 			title: 'Citation', 			icon: 'bookmark' },
			{ key: 'citationList', 		title: 'Citation List', 	icon: 'numbered-list' },
			{ key: 'discussion', 		title: 'Discussion Thread', icon: 'chat' },
			{ key: 'equation', 			title: 'Equation', 			icon: 'function' },
			// { key: 'file', 				title: 'File', 				icon: 'document' },
			{ key: 'footnote', 			title: 'Footnote', 			icon: 'asterisk' },
			{ key: 'footnoteList', 		title: 'Footnote List', 	icon: 'numbered-list' },
			{ key: 'horizontal_rule', 	title: 'Horizontal Line', 	icon: 'minus' },
			// { key: 'iframe', 			title: 'Iframe', 			icon: 'code-block' },
			// { key: 'image', 			title: 'Image', 			icon: 'media' },
			{ key: 'table', 			title: 'Table', 			icon: 'th' },
			// { key: 'video', 			title: 'Video', 			icon: 'video' },
		];

		const iconSize = this.props.isSmall ? 12 : 16;
		const selectedNode = this.props.editorChangeObject.selectedNode || {};
		const isTable = menuItems.reduce((prev, curr)=> {
			if (curr.title === 'table-delete') { return true; }
			return prev;
		}, false);

		const uncontrolledNodes = ['paragraph', 'blockquote', 'horizontal_rule', 'heading', 'ordered_list', 'bullet_list', 'list_item', 'code_block', 'citationList', 'footnoteList'];
		const isUncontrolledNode = selectedNode.type && uncontrolledNodes.indexOf(selectedNode.type.name) > -1;
		const isBlockquote = selectedNode.type && selectedNode.type.name === 'blockquote';
		const nodeSelected = !isUncontrolledNode && (selectedNode.attrs || isTable);
		const showBlockTypes = !this.props.hideBlocktypes && !nodeSelected && !isBlockquote;
		const showFormatting = !nodeSelected;
		const showExtraFormatting = showFormatting && !this.props.hideExtraFormatting;
		const showMedia = !nodeSelected && !this.props.hideMedia;
		return (
			<div className={`formatting-bar-component ${this.props.isSmall ? 'small' : ''}`}>
				{/* Block Types Dropdown */}
				{showBlockTypes &&
					<DropdownButton
						label={blockTypeItems.reduce((prev, curr)=> {
							const menuItem = menuItemsObject[curr.key] || {};
							if (menuItem.isActive) { return curr.title; }
							return prev;
						}, '')}
						isMinimal={true}
						usePortal={false}
					>
						<Menu>
							{blockTypeItems.map((item)=> {
								const menuItem = menuItemsObject[item.key] || {};
								return (
									<MenuItem
										key={item.key}
										active={menuItem.isActive}
										text={item.title}
										onClick={()=> {
											menuItem.run();
											this.props.editorChangeObject.view.focus();
										}}
									/>
								);
							})}
						</Menu>
					</DropdownButton>
				}

				{showBlockTypes && <div className="separator" />}

				{/* Formatting Options */}
				{showFormatting && formattingItems.filter((item)=> {
					const menuItem = menuItemsObject[item.key] || {};
					return menuItem.canRun;
				}).map((item)=> {
					const menuItem = menuItemsObject[item.key] || {};
					return (
						<Button
							key={item.key}
							icon={<Icon icon={item.icon} iconSize={iconSize} />}
							active={menuItem.isActive}
							minimal={true}
							onClick={menuItem.run}
							onMouseDown={(evt)=> {
								evt.preventDefault();
							}}
						/>
					);
				})}
				{showExtraFormatting &&
					<Popover
						content={
							<Menu>
								{insertItems.map((item)=> {
									return (
										<MenuItem
											key={item.key}
											text={item.title}
											icon={item.icon}
											onClick={()=> {
												const insertFunctions = this.props.editorChangeObject.insertFunctions || {};
												insertFunctions[item.key]();
												this.props.editorChangeObject.view.focus();
											}}
										/>
									);
								})}
							</Menu>
						}
						interactionKind={PopoverInteractionKind.CLICK}
						position={Position.BOTTOM}
						minimal={true}
						transitionDuration={-1}
						tetherOptions={{
							constraints: [{ attachment: 'together', to: 'window' }]
						}}
					>
						<Button
							icon={<Icon icon="more" iconSize={iconSize} />}
							minimal={true}
						/>
					</Popover>
				}
				{showExtraFormatting && showMedia && <div className="separator" /> }

				{/* Media Button */}
				{showMedia &&
					<Button
						icon={<Icon icon="media" iconSize={iconSize} />}
						text="Media"
						minimal={true}
						onClick={()=> {
							this.setState({ mediaGalleryOpen: true });
						}}
						onMouseDown={(evt)=> {
							evt.preventDefault();
						}}
					/>
				}

				{/* Node Options Blocks */}
				{nodeSelected &&
					<FormattingBarControls
						editorChangeObject={this.props.editorChangeObject}
						threads={this.props.threads}
						isSmall={this.props.isSmall}
					/>
				}

				{/* Media Gallery Overlay */}
				<Overlay
					isOpen={this.state.mediaGalleryOpen}
					onClose={this.closeMediaGallery}
					maxWidth={750}
				>
					<FormattingBarMedia />
				</Overlay>
			</div>
		);
	}
}

FormattingBar.propTypes = propTypes;
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
