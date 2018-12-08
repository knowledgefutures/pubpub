/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import { Button, Tooltip, Spinner } from '@blueprintjs/core';
import Avatar from 'components/Avatar/Avatar';
import Icon from 'components/Icon/Icon';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import { s3Upload } from 'utilities';

require('./pubDraftHeader.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	// locationData: PropTypes.object,
	editorChangeObject: PropTypes.object.isRequired,
	setOptionsMode: PropTypes.func.isRequired,
	// onRef: PropTypes.func.isRequired,
	bottomCutoffId: PropTypes.string,
	collabStatus: PropTypes.string.isRequired,
	activeCollaborators: PropTypes.array.isRequired,
};

const defaultProps = {
	// locationData: { params: {} },
	bottomCutoffId: '',
};

class PubDraftHeader extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isFixed: false,
			insertFunction: undefined,
			insertKey: undefined,
			insertLoading: false,
			randKey: Math.round(Math.random() * 99999),
		};

		this.calculateIfFixed = this.calculateIfFixed.bind(this);
		this.handleInsertFunction = this.handleInsertFunction.bind(this);
		this.handleFileSelect = this.handleFileSelect.bind(this);
		this.handleUploadFinish = this.handleUploadFinish.bind(this);
		this.headerRef = React.createRef();
		this.bottomCutoffElem = null;
		this.handleScroll = throttle(this.calculateIfFixed, 50, { leading: true, trailing: true });
	}

	componentDidMount() {
		this.calculateIfFixed();
		window.addEventListener('scroll', this.handleScroll);
		this.bottomCutoffElem = document.getElementById(this.props.bottomCutoffId);
	}

	componentWillUnmount() {
		window.removeEventListener('scroll', this.handleScroll);
	}

	handleInsertFunction(insertItem) {
		const insertFunctions = this.props.editorChangeObject.insertFunctions || {};
		const uploadKeys = ['image', 'video', 'file'];
		if (uploadKeys.indexOf(insertItem.key) > -1) {
			return this.setState({
				insertFunction: insertFunctions[insertItem.key],
				insertKey: insertItem.key,
			});
		}
		return insertFunctions[insertItem.key]();
	}

	handleFileSelect(evt) {
		if (evt.target.files.length) {
			s3Upload(evt.target.files[0], ()=>{}, this.handleUploadFinish, 0);
			this.setState({ insertLoading: true });
		}
	}

	handleUploadFinish(evt, index, type, filename) {
		/* This timeout is due to S3 returning a 404 if we render the */
		/* image immediately after upload. S3 seems to have read-after-write */
		/* consistency - but I am still seeing problems with it. 500ms */
		/* seems to do the trick, but this is pretty hand-wavy. */
		setTimeout(()=> {
			this.state.insertFunction({ url: `https://assets.pubpub.org/${filename}` });
			this.setState({
				insertFunction: undefined,
				insertKey: undefined,
				insertLoading: false,
				randKey: Math.round(Math.random() * 99999)
			});
		}, 500);
	}

	calculateIfFixed() {
		/* 73 is the height of .wrapper */
		const isOverBottom = this.bottomCutoffElem && this.bottomCutoffElem.getBoundingClientRect().top < 73;
		if (!this.state.isFixed) {
			const isAboveTop = this.headerRef.current.getBoundingClientRect().top < 0;
			if (isAboveTop && !isOverBottom) {
				this.setState({ isFixed: true });
			}
		} else {
			const isBelowTop = this.headerRef.current.getBoundingClientRect().top > 0;
			if (isBelowTop || isOverBottom) {
				this.setState({ isFixed: false });
			}
		}
	}

	render() {
		const pubData = this.props.pubData;
		const uniqueActiveCollaborators = {};
		this.props.activeCollaborators.forEach((item)=> {
			if (item.initials !== '?') {
				uniqueActiveCollaborators[item.id] = item;
			}
		});
		const numAnonymous = this.props.activeCollaborators.reduce((prev, curr)=> {
			if (curr.initials === '?') { return prev + 1; }
			return prev;
		}, 0);
		if (numAnonymous) {
			uniqueActiveCollaborators.anon = {
				backgroundColor: 'rgba(96,96,96, 0.2)',
				cursorColor: 'rgba(96,96,96, 1.0)',
				id: 'anon',
				initials: numAnonymous,
				name: `${numAnonymous} anonymous user${numAnonymous === 1 ? '' : 's'}`,
			};
		}
		const menuItems = this.props.editorChangeObject.menuItems || [];
		const menuItemsObject = menuItems.reduce((prev, curr)=> {
			return { ...prev, [curr.title]: curr };
		}, {});

		const formattingItems = [
			{
				key: 'header1',
				icon: <Icon icon="header-one" />
			},
			{
				key: 'header2',
				icon: <Icon icon="header-two" />
			},
			{
				key: 'strong',
				icon: <Icon icon="bold" />
			},
			{
				key: 'em',
				icon: <Icon icon="italic" />
			},
			{
				key: 'code',
				icon: <Icon icon="code" />
			},
			{
				key: 'subscript',
				icon: <Icon icon="subscript" />
			},
			{
				key: 'superscript',
				icon: <Icon icon="superscript" />
			},
			{
				key: 'strikethrough',
				icon: <Icon icon="strikethrough" />
			},
			{
				key: 'blockquote',
				icon: <Icon icon="citation" />
			},
			{
				key: 'bullet-list',
				icon: <Icon icon="list-ul" />
			},
			{
				key: 'numbered-list',
				icon: <Icon icon="list-ol" />
			},
			{
				key: 'link',
				icon: <Icon icon="link" />
			},
		];

		const insertItems = [
			{
				key: 'citation',
				title: 'Citation',
				icon: <Icon icon="bookmark" />
			},
			{
				key: 'citationList',
				title: 'Citation List',
				icon: <Icon icon="numbered-list" />
			},
			{
				key: 'code_block',
				title: 'Code Block',
				icon: <Icon icon="code" />
			},
			{
				key: 'discussion',
				title: 'Discussion Thread',
				icon: <Icon icon="chat" />
			},
			{
				key: 'equation',
				title: 'Equation',
				icon: <Icon icon="function" />
			},
			{
				key: 'file',
				title: 'File',
				icon: <Icon icon="document" />
			},
			{
				key: 'footnote',
				title: 'Footnote',
				icon: <Icon icon="asterisk" />
			},
			{
				key: 'footnoteList',
				title: 'Footnote List',
				icon: <Icon icon="numbered-list" />
			},
			{
				key: 'horizontal_rule',
				title: 'Horizontal Line',
				icon: <Icon icon="minus" />
			},
			{
				key: 'iframe',
				title: 'Iframe',
				icon: <Icon icon="code-block" />
			},
			{
				key: 'image',
				title: 'Image',
				icon: <Icon icon="media" />
			},
			{
				key: 'table',
				title: 'Table',
				icon: <Icon icon="th" />
			},
			{
				key: 'video',
				title: 'Video',
				icon: <Icon icon="video" />
			},
		];

		const viewOnly = !pubData.isDraftEditor && !pubData.isManager;

		return (
			<div className="pub-draft-header-component" ref={this.headerRef}>
				<div className={`wrapper ${this.state.isFixed ? 'fixed' : ''}`}>
					<div className="container pub">
						<div className="row">
							<div className="col-12">
								<div className="left-section">
									<span className={`collab-status ${this.props.collabStatus}`}>
										<span>Working Draft </span>
										{this.props.collabStatus}
										{this.props.collabStatus === 'saving' || this.props.collabStatus === 'connecting' ? '...' : ''}
									</span>
								</div>
								{pubData.isManager &&
									<div className="right-section">
										<button className="bp3-button bp3-intent-primary bp3-small" type="button" onClick={()=> { this.props.setOptionsMode('saveVersion'); }}>Save Version</button>
									</div>
								}
							</div>
							<div className="col-12">
								{viewOnly &&
									<div className="left-section">
										<div className="bp3-callout bp3-intent-warning">
											<b>Read Only</b> You have view permissions to the working draft but cannot edit it.
										</div>
									</div>
								}
								{!viewOnly &&
									<div className="left-section">
										{formattingItems.map((item)=> {
											const menuItem = menuItemsObject[item.key] || {};
											return (
												<Button
													key={item.key}
													className="bp3-minimal menu-button"
													icon={item.icon}
													active={menuItem.isActive}
													onClick={menuItem.run}
													onMouseDown={(evt)=> {
														evt.preventDefault();
													}}
												/>
											);
										})}
										<DropdownButton
											label="Insert"
											isSmall={true}
											isMinimal={true}
											isOpen={this.state.insertFunction ? true : undefined}
											key={this.state.randKey}
										>
											{insertItems.map((item)=> {
												const uploadTypes = {
													image: 'image/png, image/jpeg, image/gif',
													video: 'video/mp4, video/webm',
													file: '*',
												};
												return (
													<label
														className={`bp3-menu-item insert-menu-item ${this.state.insertFunction ? '' : ' bp3-popover-dismiss'}`}
														key={item.key}
														onClick={()=> {
															this.handleInsertFunction(item);
														}}
														id={`label-${item.key}`}
														htmlFor={item.key}
													>
														{item.icon}
														<span>{item.title}</span>
														{!!this.state.insertLoading && item.key === this.state.insertKey &&
															<span className="bp3-menu-item-label">
																<Spinner small={true} />
															</span>
														}
														{Object.keys(uploadTypes).indexOf(item.key) > -1 &&
															<input
																type="file"
																id={item.key}
																name={item.key}
																style={{ display: 'none' }}
																onChange={this.handleFileSelect}
																accept={uploadTypes[item.key]}
															/>
														}
													</label>
												);
											})}
										</DropdownButton>
									</div>
								}
								<div className="right-section">
									{Object.keys(uniqueActiveCollaborators).map((key)=> {
										return uniqueActiveCollaborators[key];
									}).filter((item)=> {
										return item && item.id !== this.props.loginData.id;
									}).map((collaborator)=> {
										return (
											<div className="avatar-wrapper" key={`present-avatar-${collaborator.id}`}>
												<Tooltip
													content={collaborator.name}
													tooltipClassName="bp3-dark"
												>
													<Avatar
														/* Cast userInitials to string since
														the anonymous Avatar is a int count */
														userInitials={String(collaborator.initials)}
														userAvatar={collaborator.image}
														borderColor={collaborator.cursorColor}
														borderWidth="2px"
														width={24}
													/>
												</Tooltip>
											</div>
										);
									})}
									{/* <button className="bp3-button bp3-small" type="button">
										Editing
										<span className="bp3-icon-standard bp3-icon-caret-down bp3-align-right" />
									</button> */}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

PubDraftHeader.propTypes = propTypes;
PubDraftHeader.defaultProps = defaultProps;
export default PubDraftHeader;
