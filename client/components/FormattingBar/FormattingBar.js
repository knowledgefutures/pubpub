import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'components/Icon/Icon';
import {
	OverflowList,
	Boundary,
	Button,
	AnchorButton,
	Classes,
	Menu,
	MenuItem,
	Popover,
	Position,
	PopoverInteractionKind,
} from '@blueprintjs/core';
import { Overlay, DropdownButton } from 'components';
import Controls from './Controls';
import Media from './Media';

require('./formattingBar.scss');

const propTypes = {
	editorChangeObject: PropTypes.object.isRequired,
	hideMedia: PropTypes.bool,
	hideBlocktypes: PropTypes.bool,
	hideExtraFormatting: PropTypes.bool,
	isSmall: PropTypes.bool,
	threads: PropTypes.array,
	footnotes: PropTypes.array,
	citations: PropTypes.array,
};

const defaultProps = {
	hideMedia: false,
	hideBlocktypes: false,
	hideExtraFormatting: false,
	isSmall: false,
	threads: [],
	footnotes: [],
	citations: [],
};

class FormattingBar extends Component {
	constructor(props) {
		super(props);
		this.state = {
			mediaGalleryOpen: false,
		};
		this.closeMediaGallery = this.closeMediaGallery.bind(this);
		this.handleInsert = this.handleInsert.bind(this);
	}

	closeMediaGallery() {
		this.setState({ mediaGalleryOpen: false }, () => {
			this.props.editorChangeObject.view.focus();
		});
	}

	handleInsert(insertType, insertData) {
		const insertFunctions = this.props.editorChangeObject.insertFunctions || {};
		insertFunctions[insertType](insertData);
		this.closeMediaGallery();
	}

	render() {
		const menuItems = this.props.editorChangeObject.menuItems || [];
		const menuItemsObject = menuItems.reduce((prev, curr) => {
			return { ...prev, [curr.title]: curr };
		}, {});

		const blockTypeItems = [
			{ key: 'paragraph', title: 'Paragraph', shortTitle: 'Para', icon: 'git-merge' },
			{ key: 'header1', title: 'Header 1', shortTitle: 'H1', icon: 'header-one' },
			{ key: 'header2', title: 'Header 2', shortTitle: 'H2', icon: 'header-two' },
			{ key: 'header3', title: 'Header 3', shortTitle: 'H3', icon: 'comparison' },
			{
				key: 'header4',
				title: 'Header 4',
				shortTitle: 'H4',
				icon: 'comparison',
				hideInMenu: true,
			},
			{
				key: 'header5',
				title: 'Header 5',
				shortTitle: 'H5',
				icon: 'comparison',
				hideInMenu: true,
			},
			{
				key: 'header6',
				title: 'Header 6',
				shortTitle: 'H6',
				icon: 'comparison',
				hideInMenu: true,
			},
			{ key: 'code_block', title: 'Code Block', shortTitle: 'Code', icon: 'code' },
		];

		const formattingItems = [
			{ key: 'strong', title: 'Bold', icon: 'bold', priority: true },
			{ key: 'em', title: 'Italic', icon: 'italic', priority: true },
			{ key: 'link', title: 'Link', icon: 'link', priority: true },
			{ key: 'bullet-list', title: 'Bullet List', icon: 'list-ul' },
			{ key: 'numbered-list', title: 'Numbered List', icon: 'list-ol' },
			{ key: 'blockquote', title: 'Blockquote', icon: 'citation' },
			{ key: 'code', title: 'Code', icon: 'code' },
			{ key: 'subscript', title: 'Subscript', icon: 'subscript' },
			{ key: 'superscript', title: 'Superscript', icon: 'superscript' },
			{ key: 'strikethrough', title: 'Strikethrough', icon: 'strikethrough' },
			{
				key: 'expander',
			} /* This is used so that there is always overflow, allowing the insertItems to be shown */,
		].filter((item) => {
			return !this.props.hideExtraFormatting || item.priority;
		});

		const insertItems = [
			{ key: 'citation', title: 'Citation', icon: 'bookmark' },
			{ key: 'citationList', title: 'Citation List', icon: 'numbered-list' },
			{ key: 'discussion', title: 'Discussion Thread', icon: 'chat' },
			{ key: 'equation', title: 'Equation', icon: 'function' },
			{ key: 'footnote', title: 'Footnote', icon: 'asterisk' },
			{ key: 'footnoteList', title: 'Footnote List', icon: 'numbered-list' },
			{ key: 'horizontal_rule', title: 'Horizontal Line', icon: 'minus' },
			{ key: 'table', title: 'Table', icon: 'th' },
		].filter((item) => {
			if (!this.props.threads.length && item.key === 'discussion') {
				return false;
			}
			return !this.props.hideExtraFormatting;
		});

		const iconSize = this.props.isSmall ? 12 : 16;
		const selectedNode = this.props.editorChangeObject.selectedNode || {};
		const isTable = menuItems.reduce((prev, curr) => {
			if (curr.title === 'table-delete') {
				return true;
			}
			return prev;
		}, false);
		const activeLink = this.props.editorChangeObject.activeLink || {};
		const showLink = !!activeLink.attrs;

		const uncontrolledNodes = [
			'paragraph',
			'blockquote',
			'horizontal_rule',
			'heading',
			'ordered_list',
			'bullet_list',
			'list_item',
			'code_block',
			'citationList',
			'footnoteList',
		];
		const isUncontrolledNode =
			selectedNode.type && uncontrolledNodes.indexOf(selectedNode.type.name) > -1;
		const isBlockquote = selectedNode.type && selectedNode.type.name === 'blockquote';
		const nodeSelected = !isUncontrolledNode && selectedNode.attrs;
		const showBlockTypes = !this.props.hideBlocktypes && !nodeSelected && !isBlockquote;
		const showFormatting = !nodeSelected;
		const showExtraFormatting = showFormatting && !this.props.hideExtraFormatting;
		const showTable = isTable && !nodeSelected;
		const showMedia =
			!nodeSelected && !this.props.hideMedia && !(this.props.isSmall && showLink);

		const view = this.props.editorChangeObject.view || {};
		if (!view.editable) {
			return <div className="formatting-bar-component" />;
		}
		return (
			<div className={`formatting-bar-component ${this.props.isSmall ? 'small' : ''}`}>
				{/* Block Types Dropdown */}
				{showBlockTypes && (
					<DropdownButton
						label={blockTypeItems.reduce((prev, curr) => {
							const menuItem = menuItemsObject[curr.key] || {};
							if (menuItem.isActive) {
								return (
									<span>
										<span className="full-title">{curr.title}</span>
										<span className="short-title">{curr.shortTitle}</span>
									</span>
								);
							}
							return prev;
						}, '')}
						isMinimal={true}
						usePortal={false}
					>
						<Menu>
							{blockTypeItems
								.filter((item) => {
									return !item.hideInMenu;
								})
								.map((item) => {
									const menuItem = menuItemsObject[item.key] || {};
									return (
										<MenuItem
											key={item.key}
											active={menuItem.isActive}
											text={item.title}
											onClick={() => {
												menuItem.run();
												this.props.editorChangeObject.view.focus();
											}}
										/>
									);
								})}
						</Menu>
					</DropdownButton>
				)}

				{showBlockTypes && <div className="separator" />}

				{/* Formatting Options */}
				{showFormatting && (
					<OverflowList
						className="formatting-list"
						collapseFrom={Boundary.END}
						observeParents={true}
						items={formattingItems}
						visibleItemRenderer={(item) => {
							if (item.key === 'expander') {
								return <div key={item.key} style={{ width: '100vw' }} />;
							}

							const insertFunctions =
								this.props.editorChangeObject.insertFunctions || {};
							const insertFunction = insertFunctions[item.key];
							const menuItem = menuItemsObject[item.key] || {};
							if (!menuItem.canRun && !insertFunction) {
								return null;
							}
							if (item.key === 'link' && this.props.isSmall && showLink) {
								return null;
							}
							const linkIsActive = item.key === 'link' && showLink;
							return (
								<Button
									key={item.key}
									aria-label={item.title}
									icon={<Icon icon={item.icon} iconSize={iconSize} />}
									active={menuItem.isActive || linkIsActive}
									minimal={true}
									onClick={() => {
										if (insertFunction) {
											insertFunction();
											this.props.editorChangeObject.view.focus();
										} else {
											menuItem.run();
										}
									}}
									onMouseDown={(evt) => {
										evt.preventDefault();
									}}
								/>
							);
						}}
						overflowRenderer={(items) => {
							const allItems = [...items, ...insertItems];
							return (
								<Popover
									content={
										<Menu>
											{allItems.map((item) => {
												if (item.key === 'expander') {
													return null;
												}

												const insertFunctions =
													this.props.editorChangeObject.insertFunctions ||
													{};
												const insertFunction = insertFunctions[item.key];
												const menuItem = menuItemsObject[item.key] || {};
												if (!menuItem.canRun && !insertFunction) {
													return null;
												}
												if (
													item.key === 'link' &&
													this.props.isSmall &&
													showLink
												) {
													return null;
												}

												return (
													<MenuItem
														key={item.key}
														text={item.title}
														icon={<Icon icon={item.icon} />}
														onClick={() => {
															if (insertFunction) {
																insertFunction();
																this.props.editorChangeObject.view.focus();
															} else {
																menuItem.run();
															}
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
								>
									<Button
										icon={<Icon icon="more" iconSize={iconSize} />}
										minimal={true}
									/>
								</Popover>
							);
						}}
					/>
				)}

				{showExtraFormatting && showMedia && <div className="separator" />}

				{/* Media Button */}
				{showMedia && (
					<Button
						icon={<Icon icon="media" iconSize={iconSize} />}
						text="Media"
						minimal={true}
						onClick={() => {
							this.setState({ mediaGalleryOpen: true });
						}}
						onMouseDown={(evt) => {
							evt.preventDefault();
						}}
					/>
				)}

				{/* Node Options Blocks */}
				{(nodeSelected || showTable) && (
					<Controls
						editorChangeObject={this.props.editorChangeObject}
						threads={this.props.threads}
						isSmall={this.props.isSmall}
						footnotes={this.props.footnotes}
						citations={this.props.citations}
					/>
				)}

				{/* Link Formatting */}
				{showLink && !this.props.isSmall && <div className="separator" />}
				{showLink && (
					<div className="link-formatting">
						<input
							placeholder="Enter URL"
							className={`${Classes.INPUT} ${Classes.SMALL}`}
							value={activeLink.attrs.href}
							onChange={(evt) => {
								activeLink.updateAttrs({ href: evt.target.value });
							}}
						/>
						<AnchorButton
							icon={<Icon icon="share" iconSize={iconSize} />}
							href={activeLink.attrs.href}
							target="_blank"
							rel="noopener noreferrer"
							minimal={true}
							disabled={!activeLink.attrs.href}
						/>
						<Button
							minimal={true}
							icon={<Icon icon="delete" iconSize={iconSize} />}
							onClick={activeLink.removeLink}
						/>
					</div>
				)}

				{/* Media Gallery Overlay */}
				<Overlay
					isOpen={this.state.mediaGalleryOpen}
					onClose={this.closeMediaGallery}
					maxWidth={750}
				>
					<Media
						editorChangeObject={this.props.editorChangeObject}
						onInsert={this.handleInsert}
						isSmall={this.props.isSmall}
					/>
				</Overlay>
			</div>
		);
	}
}

FormattingBar.propTypes = propTypes;
FormattingBar.defaultProps = defaultProps;
export default FormattingBar;
