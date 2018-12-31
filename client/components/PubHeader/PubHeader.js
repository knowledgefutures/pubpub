import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import stickybits from 'stickybits';
import throttle from 'lodash.throttle';
import { apiFetch, getResizedUrl } from 'utilities';
import { EditableText, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';

require('./pubHeader.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	communityData: PropTypes.object.isRequired,
	locationData: PropTypes.object,
	setOptionsMode: PropTypes.func.isRequired,
	setPubData: PropTypes.func.isRequired,
};

const defaultProps = {
	locationData: { params: {} },
};

class PubHeader extends Component {
	constructor(props) {
		super(props);
		this.state = {
			title: props.pubData.title,
			isMounted: false,
		};

		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleTitleSave = this.handleTitleSave.bind(this);
		this.recalculateStickyOffset = this.recalculateStickyOffset.bind(this);
		this.stickyInstance = undefined;
		this.headerRef = React.createRef();
		this.handleResize = throttle(this.recalculateStickyOffset, 50, { leading: true, trailing: true });
		this.offsetHeight = undefined;
	}

	componentDidMount() {
		this.setState({ isMounted: true });
		if (window.innerWidth > 750) {
			this.offsetHeight = this.headerRef.current.offsetHeight;
			this.stickyInstance = stickybits('.pub-header-component', { stickyBitStickyOffset: 35 - this.offsetHeight, useStickyClasses: true });
		}
		window.addEventListener('resize', this.handleResize);
	}

	componentDidUpdate() {
		this.recalculateStickyOffset();
	}

	componentWillUnmount() {
		this.stickyInstance.cleanup();
		window.removeEventListener('resize', this.handleResize);
	}

	recalculateStickyOffset() {
		const nextOffsetHeight = this.headerRef.current.offsetHeight;
		if (nextOffsetHeight !== this.offsetHeight && window.innerWidth > 750) {
			this.offsetHeight = nextOffsetHeight;
			if (this.stickyInstance) { this.stickyInstance.cleanup(); }
			this.stickyInstance = stickybits('.pub-header-component', { stickyBitStickyOffset: 35 - this.offsetHeight, useStickyClasses: true });
		}
		if (window.innerWidth < 750) {
			this.offsetHeight = undefined;
			if (this.stickyInstance) { this.stickyInstance.cleanup(); }
		}
	}

	handleTitleChange(newTitle) {
		this.setState({ title: newTitle.replace(/\n/g, '') });
	}

	handleTitleSave(newTitle) {
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				title: newTitle,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then(()=> {
			this.props.setPubData({
				...this.props.pubData,
				title: newTitle,
			});
		})
		.catch((err)=> {
			console.error('Error Saving: ', err);
		});
	}

	render() {
		const pubData = this.props.pubData;
		// const authors = pubData.collaborators.filter((collaborator)=> {
		// 	return collaborator.Collaborator.isAuthor;
		// });
		const queryObject = this.props.locationData.query;
		const activeDiscussionChannel = pubData.discussionChannels.reduce((prev, curr)=> {
			if (queryObject.channel === curr.title) { return curr; }
			return prev;
		}, { title: 'public' });

		const authors = pubData.attributions.filter((attribution)=> {
			return attribution.isAuthor;
		});
		const useHeaderImage = pubData.useHeaderImage && pubData.avatar;
		const backgroundStyle = {};
		if (useHeaderImage) {
			const resizedBackground = getResizedUrl(pubData.avatar, 'fit-in', '1500x600');
			backgroundStyle.backgroundImage = `url("${resizedBackground}")`;
			backgroundStyle.color = 'white';
		}
		// const mode = props.locationData.params.mode;
		// const subMode = props.locationData.params.subMode;
		const activeVersion = pubData.activeVersion;
		const sortedVersionsList = pubData.versions.sort((foo, bar)=>{
			if (foo.createdAt < bar.createdAt) { return 1; }
			if (foo.createdAt > bar.createdAt) { return -1; }
			return 0;
		});

		const numNewerVersions = !pubData.isDraft && pubData.versions.reduce((prev, curr)=> {
			if (curr.createdAt > activeVersion.createdAt) { return prev + 1; }
			return prev;
		}, 0);
		const numDiscussions = pubData.discussions.length;
		// const numAttributions = pubData.collaborators.filter((item)=> {
		// 	return item.Collaborator.isAuthor || item.Collaborator.isContributor;
		// }).length;
		const numAttributions = pubData.attributions.length;

		const useEditableTitle = pubData.isDraft && pubData.isManager && this.state.isMounted;
		return (
			<div className="pub-header-component" style={backgroundStyle} ref={this.headerRef}>
				<div className={`wrapper ${useHeaderImage ? 'dim' : ''}`}>
					<div className="container pub">
						<div className="row">
							<div className="col-12">
								<div className="tags-buttons-wrapper">
									<div className="tags">
										{/* pubData.collections.sort((foo, bar)=> {
											if (foo.title.toLowerCase() < bar.title.toLowerCase()) { return -1; }
											if (foo.title.toLowerCase() > bar.title.toLowerCase()) { return 1; }
											return 0;
										}).map((item)=> {
											return <a key={`footer-collection-${item.id}`} href={`/${item.slug}`} className="bp3-tag bp3-intent-primary bp3-minimal">{item.title}</a>;
										}) */}
										<div className="tags new-tags">
											{pubData.pubTags.filter((pubTag)=> {
												return pubTag.tag;
											}).sort((foo, bar)=> {
												if (foo.tag.title.toLowerCase() < bar.tag.title.toLowerCase()) { return -1; }
												if (foo.tag.title.toLowerCase() > bar.tag.title.toLowerCase()) { return 1; }
												return 0;
											}).map((item)=> {
												return (
													<a key={`new-tag-collection-${item.id}`} href={item.tag.page ? `/${item.tag.page.slug}` : `/search?tag=${item.tag.title}`} className="bp3-tag bp3-intent-primary bp3-minimal">
														{!item.tag.isPublic &&
															<Icon icon="lock2" />
														}
														{item.tag.title}
													</a>
												);
											})}
										</div>
									</div>
									<div className="buttons">
										{!pubData.isDraft && (pubData.isDraftViewer || pubData.isDraftEditor || pubData.isManager) &&
											<a
												className="bp3-button bp3-small"
												href={`/pub/${pubData.slug}/draft`}
											>
												Go To Working Draft
											</a>
										}
										<button
											className="bp3-button bp3-small"
											type="button"
											onClick={()=> {
												this.props.setOptionsMode(pubData.isManager ? 'details' : 'attribution');
											}}
										>
											Options
										</button>

										{pubData.isManager &&
											<button
												className="bp3-button bp3-small"
												type="button"
												onClick={()=> {
													this.props.setOptionsMode('sharing');
												}}
											>
												Share
											</button>
										}
									</div>
								</div>

								<h1>
									{useEditableTitle &&
										<EditableText
											placeholder="Add a Pub Title"
											onConfirm={this.handleTitleSave}
											onChange={this.handleTitleChange}
											value={this.state.title}
											multiline={true}
											confirmOnEnterKey={true}
										/>
									}
									{!useEditableTitle &&
										<span className="editable-text-match">{pubData.title}</span>
									}
								</h1>

								{pubData.description &&
									<div className="description">{pubData.description}</div>
								}

								{!!authors.length &&
									<div className="authors">
										<span>by </span>
										{authors.sort((foo, bar)=> {
											if (foo.order < bar.order) { return -1; }
											if (foo.order > bar.order) { return 1; }
											if (foo.createdAt < bar.createdAt) { return 1; }
											if (foo.createdAt > bar.createdAt) { return -1; }
											return 0;
										}).map((author, index)=> {
											const separator = index === authors.length - 1 || authors.length === 2 ? '' : ', ';
											const prefix = index === authors.length - 1 && index !== 0 ? ' and ' : '';
											const user = author.user;
											if (user.slug) {
												return (
													<span key={`author-${user.id}`}>
														{prefix}
														<a href={`/user/${user.slug}`}>{user.fullName}</a>
														{separator}
													</span>
												);
											}
											return <span key={`author-${user.id}`}>{prefix}{user.fullName}{separator}</span>;
										})}
									</div>
								}
								<div className="details">
									<Popover
										content={
											<div className="bp3-menu">
												{(pubData.isDraftViewer || pubData.isDraftEditor || pubData.isManager) &&
													<li>
														<a className={`bp3-menu-item ${pubData.isDraft ? 'bp3-active' : ''}`} tabIndex="0" href={`/pub/${pubData.slug}/draft`}>
															Working Draft
														</a>
													</li>
												}
												{sortedVersionsList.map((version)=> {
													return (
														<li key={version.id}>
															<a className={`bp3-menu-item ${version.id === pubData.activeVersion.id ? 'bp3-active' : ''}`} tabIndex="0" href={`/pub/${pubData.slug}?version=${version.id}`}>
																{dateFormat(version.createdAt, 'mmm dd, yyyy · h:MMTT')}
																{!version.isPublic && <Icon icon="lock2" />}
															</a>
														</li>
													);
												})}
											</div>
										}
										interactionKind={PopoverInteractionKind.CLICK}
										position={Position.BOTTOM_LEFT}
										popoverClassName="versions-popover"
										// transitionDuration={-1}
										minimal={true}
										// inline={true}
										inheritDarkTheme={false}
									>
										<div
											// href={`/pub/${pubData.slug}/versions`}
											// onClick={(evt)=> {
											// 	evt.preventDefault();
											// 	this.props.setOptionsMode('versions');
											// }}
											role="button"
											tabIndex={-1}
											className="detail-button versions"
										>
											{!pubData.isDraft && !activeVersion.isPublic &&
												<Icon icon="lock2" />
											}
											{!pubData.isDraft &&
												<span>{sortedVersionsList[sortedVersionsList.length - 1].id !== activeVersion.id ? 'Updated ' : ''}{dateFormat(pubData.activeVersion.createdAt, 'mmm dd, yyyy')}</span>
											}
											{/* If is draft, say total number of saved versions */}
											{pubData.isDraft &&
												<span>Working Draft ({pubData.versions.length} Saved Version{pubData.versions.length === 1 ? '' : 's'})</span>
											}

											{/* If not draft, and newer versions, say numNewerVersions */}
											{!pubData.isDraft && !!numNewerVersions &&
												<span> ({numNewerVersions} Newer Version{numNewerVersions === 1 ? '' : 's'})</span>
											}

											{/* If not draft, and no newer versions, and more than one version, say numVersions - 1 Older Versions */}
											{!pubData.isDraft && !numNewerVersions && pubData.versions.length > 1 &&
												<span> ({pubData.versions.length - 1} Older Version{pubData.versions.length - 1 === 1 ? '' : 's'})</span>
											}
											<Icon icon="chevron-down" />
										</div>
									</Popover>
									<a
										href="#discussions"
										role="button"
										tabIndex={-1}
										className="detail-button"
									>
										{/* <span className="bp3-icon-standard bp3-icon-chat" /> */}
										{numDiscussions} Discussion{numDiscussions === 1 ? '' : 's'} (#{activeDiscussionChannel.title})
									</a>
									{!!numAttributions &&
										<div
											role="button"
											tabIndex={-1}
											className="detail-button"
											// href={`/pub/${pubData.slug}/collaborators`}
											onClick={(evt)=> {
												evt.preventDefault();
												this.props.setOptionsMode('attribution');
											}}
										>
											{/* <span className="bp3-icon-standard bp3-icon-team" /> */}
											{numAttributions} Contributor{numAttributions === 1 ? '' : 's'}
										</div>
									}
								</div>
							</div>
						</div>
					</div>
					<div className="bottom-text">
						<div className="bottom-title">{pubData.title}</div>
						<div className="bottom-buttons">
							Share · Cite · Options · Other
						</div>
					</div>
				</div>
			</div>
		);
	}
}

PubHeader.propTypes = propTypes;
PubHeader.defaultProps = defaultProps;
export default PubHeader;
