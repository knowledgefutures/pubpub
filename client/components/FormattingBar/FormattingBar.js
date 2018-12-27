import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'components/Icon/Icon';
import { Button, Tooltip, Spinner, Menu, MenuItem, Popover, Position, PopoverInteractionKind } from '@blueprintjs/core';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import Overlay from 'components/Overlay/Overlay';

require('./formattingBar.scss');

const propTypes = {
	editorChangeObject: PropTypes.object.isRequired,
	isReduced: PropTypes.bool, /* true if you wish to display fewer options on a smaller footprint (e.g. discussions) */
	isSimple: PropTypes.bool, /* true if you wish to only support text formatting (e.g. captions) */
};

const defaultProps = {
	isReduced: false,
	isSimple: false,
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
			{ key: 'strong', 		title: 'Bold', 			icon: 'bold', showInReduced: true },
			{ key: 'em', 			title: 'Italic', 		icon: 'italic', showInReduced: true },
			{ key: 'code', 			title: 'Code', 			icon: 'code' },
			{ key: 'subscript', 	title: 'Subscript', 	icon: 'subscript' },
			{ key: 'superscript', 	title: 'Superscript', 	icon: 'superscript' },
			{ key: 'strikethrough', title: 'Strikethrough', icon: 'strikethrough' },
			{ key: 'blockquote', 	title: 'Blockquote', 	icon: 'citation' },
			{ key: 'bullet-list', 	title: 'Bullet List', 	icon: 'list-ul' },
			{ key: 'numbered-list', title: 'Numbered List', icon: 'list-ol' },
			{ key: 'link', 			title: 'Link', 			icon: 'link', showInReduced: true },
		].filter((item)=> {
			return !this.props.isReduced || item.showInReduced;
		});

		const insertItems = [
			{ key: 'citation', 			title: 'Citation', 			icon: 'bookmark' },
			{ key: 'citationList', 		title: 'Citation List', 	icon: 'numbered-list' },
			// { key: 'discussion', 		title: 'Discussion Thread', icon: 'chat' },
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

		const iconSize = this.props.isReduced ? 12 : 16;
		const nodeSelected = !!this.props.editorChangeObject.selectedNode;
		const showBlockTypes = !this.props.isReduced && !this.props.isSimple && !nodeSelected;
		const showFormatting = !nodeSelected;
		const showMoreFormatting = showFormatting && !this.props.isReduced && !this.props.isSimple;
		const showMedia = !nodeSelected && !this.props.isSimple;
		return (
			<div className={`formatting-bar-component ${this.props.isReduced ? 'reduced' : ''}`}>
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
				{showMoreFormatting &&
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
						// inheritDarkTheme={false}
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
				{showMoreFormatting && showMedia && <div className="separator" /> }

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
				{this.props.editorChangeObject.selectedNode &&
					<div style={{ display: 'inline-block', height: '60px', backgroundColor: 'blue' }}>DOG</div>
				}

				{/* Media Gallery Overlay */}
				<Overlay
					isOpen={this.state.mediaGalleryOpen}
					onClose={this.closeMediaGallery}
				>
					<h3>DOGGY</h3>
					<Button
						onClick={()=> {
							const insertFunctions = this.props.editorChangeObject.insertFunctions || {};
							insertFunctions.image({ url: 'https://s7d2.scene7.com/is/image/PetSmart/5251722?$sclp-prd-main_small$' });
							this.closeMediaGallery();
						}}
					/>
				</Overlay>
			</div>
		);
	}
}

FormattingBar.propTypes = propTypes;
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
