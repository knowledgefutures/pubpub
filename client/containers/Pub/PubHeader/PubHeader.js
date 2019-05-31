/* eslint-disable react/no-danger */
import React, { useContext, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import useWindowSize from 'react-use/lib/useWindowSize';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import dateFormat from 'dateformat';
import classNames from 'classnames';
import stickybits from 'stickybits';
import { apiFetch, getResizedUrl } from 'utils';
import {
	Button,
	AnchorButton,
	EditableText,
	Position,
	Tag,
	Intent,
	Menu,
	MenuItem,
	MenuDivider,
	Popover,
} from '@blueprintjs/core';
import PubToc from 'containers/Pub/PubDocument/PubToc';
import { Icon, GridWrapper, Overlay } from 'components';
import ActionButton from './ActionButton';
import SharePanel from './SharePanel';
import styleGenerator from './styleGenerator';
import { generateSubmissionButtons } from './headerUtils';

require('./pubHeader.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	// communityData: PropTypes.object.isRequired,
	// locationData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
	// setPubData: PropTypes.func.isRequired,
	// activeDiscussionChannel: PropTypes.object,
	// setDiscussionChannel: PropTypes.func.isRequired,
};

// const defaultProps = {
// 	locationData: { params: {} },
// 	activeDiscussionChannel: { title: 'public' },
// };

const PubHeader = (props) => {
	/*
		We need communityWide accentColor (dark and light)
		We need pub headerStyle setting
		We need pub headerStyle background (color, gradient, tile, stretch)
			Do we ever infer from avatar - or should we drop that idea?
			No. We can infer the avatar from the backgroundHeader if we want - but not the other way around.
			We probably want a component that can wrap and be used as a background tool. Takes image, dim, etc.
			Use it on the pub header, previews, etc
		We need pub headerStyle accent color (do we allow something other than community default?)
			No - use the light or dark community accent default for now.
		Where do we show open/completed submissions?
			How do you get to pub/slug/submissions?
		Do we require an accent color with the block styles? Or can they be simple white/black text?
	*/
	const { pubData, collabData, updateLocalData, historyData } = props;
	const { communityData, locationData } = useContext(PageContext);
	const headerRef = useRef(null);
	const [title, setTitle] = useState(props.pubData.title);
	const [isMounted, setIsMounted] = useState(false);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [isShareOpen, setIsShareOpen] = useState(false);
	const { width: windowWidth } = useWindowSize();
	const isDocMode = pubData.mode === 'document';
	const isSubmissionsMode = pubData.mode === 'submission';

	useEffect(() => {
		if (!isDocMode) {
			return () => {};
		}
		setIsMounted(true);
		const nextOffsetHeight = headerRef.current.offsetHeight;
		const stickyInstance = stickybits('.pub-header-component', {
			stickyBitStickyOffset: 35 - nextOffsetHeight,
			useStickyClasses: true,
		});

		return () => {
			stickyInstance.cleanup();
		};
	}, [pubData, windowWidth, isDocMode]);

	const handleTitleSave = (newTitle) => {
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				title: newTitle,
				pubId: props.pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				updateLocalData('pub', {
					title: newTitle,
				});
				setIsEditingTitle(false);
			})
			.catch((err) => {
				console.error('Error Saving: ', err);
			});
	};

	// const authors = pubData.collaborators.filter((collaborator)=> {
	// 	return collaborator.Collaborator.isAuthor;
	// });
	// const queryObject = this.props.locationData.query;
	// const activeDiscussionChannel = pubData.discussionChannels.reduce(
	// 	(prev, curr) => {
	// 		if (queryObject.channel === curr.title) {
	// 			return curr;
	// 		}
	// 		return prev;
	// 	},
	// 	{ title: 'public' },
	// );

	const authors = pubData.attributions.filter((attribution) => {
		return attribution.isAuthor;
	});
	const useHeaderImage = pubData.useHeaderImage && pubData.avatar;
	const backgroundStyle = {};
	if (useHeaderImage) {
		const resizedBackground = getResizedUrl(pubData.avatar, 'fit-in', '1500x600');
		backgroundStyle.backgroundImage = `url("${resizedBackground}")`;
	}

	// const isDocMode = pubData.mode === 'document';
	const useEditableTitle = pubData.canManage && isMounted && isDocMode;
	let pubTitle = pubData.title;
	if (isEditingTitle) {
		pubTitle = title;
	}

	const metaModes = [
		{ title: 'Details', icon: 'more', key: 'details' },
		{ title: 'Download', icon: 'download2', key: 'download' },
		{ title: 'Social Sharing', icon: 'share2', key: 'social' },
		{ title: 'Metrics', icon: 'timeline-bar-chart', key: 'metrics' },
		{ title: 'Discussions', icon: 'chat', key: 'discussions' },
	];

	const manageMode = locationData.params && locationData.params.manageMode;
	const accentColor = pubData.headerStyle === 'white-blocks' ? '#A2273E' : '#ecd721';
	const headerStyleClassName = (isDocMode && pubData.headerStyle) || '';
	const submissionButtons = generateSubmissionButtons(pubData);

	const pubDate =
		(historyData && historyData.timestamps && historyData.timestamps[historyData.currentKey]) ||
		pubData.updatedAt;
	const pubDateString =
		historyData && historyData.outstandingRequests > 0
			? '...'
			: dateFormat(pubDate, 'mmm dd, yyyy');

	return (
		<div className="pub-header-component new" style={backgroundStyle} ref={headerRef}>
			<div
				className={classNames({
					wrapper: true,
					dim: !headerStyleClassName && useHeaderImage,
					[headerStyleClassName]: true,
				})}
			>
				<GridWrapper containerClassName="pub">
					<style
						dangerouslySetInnerHTML={{
							__html: styleGenerator(pubData.headerStyle, accentColor),
						}}
					/>
					{isDocMode && (
						<div className="tags-bar">
							<div className="left">
								{pubData.collectionPubs
									.filter((collectionPub) => {
										return collectionPub.collection;
									})
									.sort((foo, bar) => {
										if (
											foo.collection.title.toLowerCase() <
											bar.collection.title.toLowerCase()
										) {
											return -1;
										}
										if (
											foo.collection.title.toLowerCase() >
											bar.collection.title.toLowerCase()
										) {
											return 1;
										}
										return 0;
									})
									.map((item) => {
										return (
											<a
												key={item.id}
												className="header-collection"
												href={
													item.collection.page
														? `/${item.collection.page.slug}`
														: `/search?tag=${item.collection.title}`
												}
											>
												<Tag
													intent={Intent.PRIMARY}
													minimal={true}
													icon={
														!item.collection.isPublic ? (
															<Icon icon="lock2" />
														) : (
															undefined
														)
													}
												>
													{item.collection.title}
												</Tag>
											</a>
										);
									})}
							</div>
							<div className="right">
								<Button
									className="manager-button"
									text="Share"
									icon="people"
									intent={Intent.PRIMARY}
									onClick={() => {
										setIsShareOpen(true);
									}}
									// href={`/pub/${pubData.slug}/manage/sharing`}
								/>
								<AnchorButton
									className="manager-button"
									text="Manage"
									href={`/pub/${pubData.slug}/manage`}
								/>
							</div>

							{/* <div className="buttons">
										{!pubData.isDraft &&
											(pubData.isDraftViewer ||
												pubData.isDraftEditor ||
												pubData.isManager) && (
												<a
													className="bp3-button bp3-small"
													href={`/pub/${pubData.slug}/draft`}
												>
													Go To Working Draft
												</a>
											)}
										<button
											className="bp3-button bp3-small"
											type="button"
											onClick={() => {
												this.props.setOptionsMode(
													pubData.isManager ? 'details' : 'attribution',
												);
											}}
										>
											Options
										</button>

										{pubData.isManager && (
											<button
												className="bp3-button bp3-small"
												type="button"
												onClick={() => {
													this.props.setOptionsMode('sharing');
												}}
											>
												Share
											</button>
										)}
									</div> */}
						</div>
					)}
					<h1 className={classNames({ small: !isDocMode })}>
						{useEditableTitle && (
							<EditableText
								placeholder="Add a Pub Title"
								onConfirm={handleTitleSave}
								onChange={(newTitle) => {
									setTitle(newTitle.replace(/\n/g, ''));
								}}
								onEdit={() => {
									setTitle(props.pubData.title);
									setIsEditingTitle(true);
								}}
								onCancel={() => {
									setIsEditingTitle(false);
								}}
								value={pubTitle}
								multiline={true}
								confirmOnEnterKey={true}
							/>
						)}
						{!useEditableTitle && (
							<React.Fragment>
								{isDocMode && <span className="text-wrapper">{pubData.title}</span>}
								{!isDocMode && (
									<a href={`/pub/${pubData.slug}`} className="text-wrapper">
										{pubData.title}
									</a>
								)}
								{/* TODO: This needs to be a link that functions more cleanly */}
								{!isDocMode && <span className="breadcrumb">{pubData.mode}</span>}
								{/* !isDocMode && manageMode && (
									<span className="breadcrumb">{manageMode}</span>
								) */}
							</React.Fragment>
						)}
					</h1>

					{isDocMode && pubData.description && (
						<div className="description">
							<span className="text-wrapper">{pubData.description}</span>
						</div>
					)}

					{isDocMode && !!authors.length && (
						<div className="authors">
							<span className="text-wrapper">
								<span>by </span>
								{authors
									.sort((foo, bar) => {
										if (foo.order < bar.order) {
											return -1;
										}
										if (foo.order > bar.order) {
											return 1;
										}
										if (foo.createdAt < bar.createdAt) {
											return 1;
										}
										if (foo.createdAt > bar.createdAt) {
											return -1;
										}
										return 0;
									})
									.map((author, index) => {
										const separator =
											index === authors.length - 1 || authors.length === 2
												? ''
												: ', ';
										const prefix =
											index === authors.length - 1 && index !== 0
												? ' and '
												: '';
										const user = author.user;
										if (user.slug) {
											return (
												<span key={`author-${user.id}`}>
													{prefix}
													<a
														href={`/user/${user.slug}`}
														className="underline-on-hover"
													>
														{user.fullName}
													</a>
													{separator}
												</span>
											);
										}
										return (
											<span key={`author-${user.id}`}>
												{prefix}
												{user.fullName}
												{separator}
											</span>
										);
									})}
							</span>
						</div>
					)}
					{isDocMode && (
						<div className="actions-bar">
							<div className="left">
								{/* History Button */}

								<ActionButton
									buttons={[
										{
											text: (
												<div className="text-stack">
													<span>History</span>
													<span className="subtext">{pubDateString}</span>
												</div>
											),
											rightIcon: 'history',
											active: pubData.metaMode === 'history',
											onClick: () => {
												updateLocalData('pub', {
													metaMode:
														pubData.metaMode === 'history'
															? undefined
															: 'history',
												});
											},
											isWide: true,
										},
									]}
									isSkewed={true}
								/>

								{/* Branches Button */}

								<ActionButton
									buttons={[
										{
											text: (
												<div className="text-stack">
													<span className="subtext">now on branch</span>
													<span>#{pubData.activeBranch.title}</span>
												</div>
											),
											rightIcon: 'caret-down',
											isWide: true,
											popoverProps: {
												content: (
													<Menu>
														<li className="bp3-menu-header">
															<h6 className="bp3-heading">
																Switch To...
															</h6>
														</li>
														{pubData.branches
															.sort((foo, bar) => {
																if (foo.order < bar.order) {
																	return -1;
																}
																if (foo.order > bar.order) {
																	return 1;
																}
																return 0;
															})
															.map((branch, index) => {
																const branchUrlSuffix = index
																	? `branch/${branch.shortId}`
																	: '';
																return (
																	<MenuItem
																		key={branch.id}
																		text={`#${branch.title}`}
																		active={
																			pubData.activeBranch
																				.id === branch.id
																		}
																		href={`/pub/${
																			pubData.slug
																		}/${branchUrlSuffix}`}
																	/>
																);
															})}
														<MenuDivider />
														<MenuItem
															// intent={Intent.WARNING}
															icon="issue-new"
															text={
																<span>
																	Branches will be slowly rolling
																	out in the coming months.
																	<br />
																	We would love your feedback
																	about the exciting new
																	possibilites.
																	<br />
																	Click to learn more and discuss.
																</span>
															}
															href="https://discourse.knowledgefutures.org/"
														/>
														{/*
															TODO-BRANCH: We're removing these items until full branch
															capabilities are rolled out
															
															<MenuItem
																icon="add"
																text="Create New Branch"
																href={`/pub/${
																	pubData.slug
																}/branch/new?init=${
																	pubData.activeBranch.shortId
																}`}
															/>
														*/}
													</Menu>
												),
												minimal: true,
												position: Position.BOTTOM_LEFT,
											},
										},
									]}
									isSkewed={true}
								/>

								{/* Submit Button */}
								{submissionButtons && (
									<ActionButton buttons={submissionButtons} isSkewed={true} />
								)}
							</div>
							<div className="right">
								{metaModes.map((mode) => {
									const isActive = pubData.metaMode === mode.key;
									return (
										<ActionButton
											key={mode.title}
											// isLarge={true}
											buttons={[
												{
													icon: mode.icon,
													active: isActive,
													alt: mode.title,
													onClick: () => {
														updateLocalData('pub', {
															metaMode: isActive
																? undefined
																: mode.key,
														});
													},
												},
											]}
										/>
									);
								})}
							</div>
						</div>
					)}
				</GridWrapper>
				<Overlay
					isOpen={isShareOpen}
					onClose={() => {
						setIsShareOpen(false);
					}}
				>
					<SharePanel pubData={pubData} updateLocalData={updateLocalData} />
				</Overlay>
				{isDocMode && (
					<div className="bottom-text">
						<div className="bottom-title">{pubData.title}</div>
						<div className="bottom-buttons">
							<Popover
								minimal={true}
								position={Position.BOTTOM_RIGHT}
								content={
									<PubToc
										pubData={pubData}
										editorChangeObject={collabData.editorChangeObject}
										useSideStyling={false}
									/>
								}
								target={<Button minimal={true}>Contents</Button>}
							/>

							<Button
								minimal={true}
								small={true}
								// onClick={() => {
								// 	this.props.setOptionsMode('cite');
								// }}
								text="Cite"
							/>
							<span className="dot">·</span>
							<Button
								minimal={true}
								small={true}
								// onClick={() => {
								// 	this.props.setOptionsMode('download');
								// }}
								text="Download"
							/>
							<span className="dot">·</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

PubHeader.propTypes = propTypes;
export default PubHeader;
