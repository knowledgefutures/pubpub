/* eslint-disable react/no-danger */
import React, { useContext, useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import useWindowSize from 'react-use/lib/useWindowSize';
// import dateFormat from 'dateformat';

import classNames from 'classnames';
import stickybits from 'stickybits';
import { getJSON } from '@pubpub/editor';
import { apiFetch, getResizedUrl } from 'utils';
import {
	Button,
	AnchorButton,
	EditableText,
	Position,
	Intent,
	Menu,
	MenuItem,
	MenuDivider,
	Popover,
} from '@blueprintjs/core';
import { GridWrapper, Overlay, Icon } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import CitationsPreview from '../PubDocument/PubDetails/CitationsPreview';
import PubToc from './PubToc';
import Download from './Download';
import Social from './Social';
import ActionButton from './ActionButton';
import SharePanel from './SharePanel';
import styleGenerator from './styleGenerator';
import { generateHeaderBreadcrumbs, getTocHeadings } from './headerUtils';
import CollectionsBar from './CollectionsBar';
import { getAllPubContributors } from '../../../utils/pubContributors';

require('./pubHeader.scss');

const propTypes = {
	collabData: PropTypes.object.isRequired,
	historyData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

// const defaultProps = {
// 	locationData: { params: {} },
// };

const PubHeader = (props) => {
	/*
	COMMUNITY:
	accentColorDark
	accentColorLight
	headerColorType: ['light', 'dark', 'custom']

	PUB:
	headerStyle: ['white-blocks', 'black-blocks', null]
	headerBackgroundType: color, image, 
	headerBackgroundImage: https://
	headerAccentType: ['light', 'dark', 'custom', null]
	*/

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

	const authors = getAllPubContributors(pubData, true);

	const useHeaderImage =
		pubData.headerBackgroundType === 'image' && pubData.headerBackgroundImage;
	const backgroundStyle = {};
	if (useHeaderImage) {
		const resizedBackground = getResizedUrl(
			pubData.headerBackgroundImage,
			'fit-in',
			'1500x600',
		);
		backgroundStyle.backgroundImage = `url("${resizedBackground}")`;
	}

	// const isDocMode = pubData.mode === 'document';
	const useEditableTitle = pubData.canManage && isMounted && isDocMode;
	let pubTitle = pubData.title;
	if (isEditingTitle) {
		pubTitle = title;
	}

	let docJson = pubData.initialDoc;
	if (collabData.editorChangeObject && collabData.editorChangeObject.view) {
		docJson = getJSON(collabData.editorChangeObject.view);
	}
	const headings = docJson ? getTocHeadings(docJson) : [];

	const metaModes = [
		{
			title: 'Contents',
			icon: 'toc',
			popoverContent: <PubToc pubData={pubData} headings={headings} />,
		},
		{
			title: 'Cite',
			icon: 'cite',
			popoverContent: (
				<div style={{ padding: '1em' }}>
					<CitationsPreview pubData={pubData} />
				</div>
			),
		},
		{
			title: 'Download',
			icon: 'download2',
			popoverContent: <Download pubData={pubData} />,
		},
		{
			title: 'Social Sharing',
			icon: 'share2',
			popoverContent: <Social pubData={pubData} />,
		},
		{
			title: 'History',
			icon: 'history',
			onClick: () => {
				updateLocalData('history', {
					isViewingHistory: !historyData.isViewingHistory,
				});
			},
		},
		// TODO(ian): re-enable these once we have something to put there
		// { title: 'Metrics', icon: 'timeline-bar-chart', key: 'metrics' },
		// { title: 'Discussions', icon: 'chat', key: 'discussions' },
	];

	const accentColor =
		pubData.headerStyle === 'white-blocks'
			? communityData.accentColorDark
			: communityData.accentColorLight;
	const headerStyleClassName = (isDocMode && pubData.headerStyle) || '';
	// const submissionButtons = generateSubmissionButtons(pubData);

	// const pubDate =
	// 	(historyData && historyData.timestamps && historyData.timestamps[historyData.currentKey]) ||
	// 	pubData.updatedAt;
	// const pubDateString =
	// 	historyData && historyData.outstandingRequests > 0
	// 		? '...'
	// 		: dateFormat(pubDate, 'mmm dd, yyyy');

	const publicBranch =
		pubData.branches.find((branch) => {
			return branch.title === 'public';
		}) || {};
	const currentBranchIsPublicBranch = publicBranch.id === pubData.activeBranch.id;
	const useDim = !headerStyleClassName && useHeaderImage;
	return (
		<div className="pub-header-component new" style={backgroundStyle} ref={headerRef}>
			<div
				className={classNames({
					wrapper: true,
					dim: useDim,
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
						<div className="top-bar">
							<div className="left">
								<CollectionsBar
									pubData={pubData}
									updateLocalData={updateLocalData}
								/>
							</div>
							{pubData.canManage && (
								<React.Fragment>
									<div className="right">
										<Button
											className="manager-button"
											text="Share"
											icon="people"
											intent={Intent.PRIMARY}
											onClick={() => {
												setIsShareOpen(true);
											}}
										/>
										<AnchorButton
											className="manager-button"
											text="Manage"
											href={`/pub/${pubData.slug}/manage`}
										/>
									</div>
								</React.Fragment>
							)}

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
									<React.Fragment>
										<a href={`/pub/${pubData.slug}`} className="text-wrapper">
											{pubData.title}
										</a>
										{generateHeaderBreadcrumbs(pubData, locationData)}
									</React.Fragment>
								)}
							</React.Fragment>
						)}
					</h1>

					{isDocMode && !!authors.length && (
						<div className="authors">
							<span className="text-wrapper">
								<span>by </span>
								{authors.map((author, index) => {
									const separator =
										index === authors.length - 1 || authors.length === 2
											? ''
											: ', ';
									const prefix =
										index === authors.length - 1 && index !== 0 ? ' and ' : '';
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

					{isDocMode && pubData.description && (
						<div className="description">
							<span className="text-wrapper">{pubData.description}</span>
						</div>
					)}

					{isDocMode && (
						<div className="actions-bar">
							<div className="left">
								{/* History Button */}

								{/* <ActionButton
									buttons={[
										{
											text: (
												<div className="text-stack">
													<span>History</span>
													<span className="action-subtext">
														{pubDateString}
													</span>
												</div>
											),
											rightIcon: 'history',
											active: historyData.isViewingHistory,
											onClick: () => {
												updateLocalData('history', {
													isViewingHistory: !historyData.isViewingHistory,
												});
											},
											isWide: true,
										},
									]}
									isSkewed={true}
								/> */}

								{/* Branches Button */}

								<ActionButton
									buttons={[
										{
											text: (
												<div className="text-stack">
													<span className="action-subtext">
														now on branch
													</span>
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
																		href={`/pub/${pubData.slug}/${branchUrlSuffix}`}
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
															href="https://discourse.knowledgefutures.org/t/branches/157"
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

								{/* Merge Button */}
								{!currentBranchIsPublicBranch &&
									pubData.activeBranch.canManage &&
									publicBranch.canManage && (
										<ActionButton
											buttons={[
												{
													text: (
														<div className="text-stack">
															<span>Publish</span>
															<span className="action-subtext">
																Merge into #public
															</span>
														</div>
													),
													href: `/pub/${pubData.slug}/merge/${pubData.activeBranch.shortId}/${publicBranch.shortId}`,
													isWide: true,
												},
											]}
											isSkewed={true}
										/>
									)}

								{/* Submit for Review button */}
								{!currentBranchIsPublicBranch && pubData.activeBranch.canManage && (
									<ActionButton
										buttons={[
											{
												text: (
													<div className="text-stack">
														<span>Submit for Review</span>
														<span className="action-subtext">
															to #public
														</span>
													</div>
												),
												href: `/pub/${pubData.slug}/reviews/new/${pubData.activeBranch.shortId}/${publicBranch.shortId}`,

												isWide: true,
											},
										]}
										isSkewed={true}
									/>
								)}

								{/* Submit Button */}
								{/* submissionButtons && (
									<ActionButton buttons={submissionButtons} isSkewed={true} />
								) */}
							</div>
							<div className="right">
								{metaModes.map((mode) => {
									const isActive =
										mode.title === 'History' && historyData.isViewingHistory;
									if (mode.title === 'Contents' && !headings.length) {
										return null;
									}
									if (mode.title === 'History') {
										return (
											<ActionButton
												key={mode.title}
												buttons={[
													{
														icon: mode.icon,
														active: isActive,
														alt: mode.title,
														onClick: mode.onClick,
													},
												]}
											/>
										);
									}
									return (
										<Popover
											key={mode.title}
											minimal={true}
											position={Position.BOTTOM_RIGHT}
											content={mode.popoverContent}
											target={
												<ActionButton
													buttons={[
														{
															icon: mode.icon,
															active: isActive,
															alt: mode.title,
														},
													]}
												/>
											}
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
							{!!headings.length && (
								<React.Fragment>
									<Popover
										minimal={true}
										position={Position.BOTTOM_RIGHT}
										content={<PubToc pubData={pubData} headings={headings} />}
										target={<Button minimal={true}>Contents</Button>}
									/>
									<span className="dot">·</span>
								</React.Fragment>
							)}
							<Button
								minimal={true}
								onClick={() =>
									window.scrollTo({ left: 0, top: 0, behavior: 'auto' })
								}
								icon={<Icon icon="double-chevron-up" />}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

PubHeader.propTypes = propTypes;
export default PubHeader;
