import React, { Component } from 'react';
import PropTypes from 'prop-types';
import firebase from '@firebase/app';
import checkIfMobile from 'is-mobile';
// import applyDevTools from 'prosemirror-dev-tools';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import PubHeader from 'components/PubHeader/PubHeader';
import PubDraftHeader from 'components/PubDraftHeader/PubDraftHeader';
import PubBody from 'components/PubBody/PubBody';
import PubOptions from 'components/PubOptions/PubOptions';
import PubSideToc from 'components/PubSideToc/PubSideToc';
import PubSideCollaborators from 'components/PubSideCollaborators/PubSideCollaborators';
import PubSideOptions from 'components/PubSideOptions/PubSideOptions';
import PubSideDiscussions from 'components/PubSideDiscussions/PubSideDiscussions';
import PubInlineImport from 'components/PubInlineImport/PubInlineImport';
import PubLicense from 'components/PubLicense/PubLicense';
import PubLoadingBars from 'components/PubLoadingBars/PubLoadingBars';
import PubInlineMenu from 'components/PubInlineMenu/PubInlineMenu';
import PubLinkMenu from 'components/PubLinkMenu/PubLinkMenu';
import PubSideControls from 'components/PubSideControls/PubSideControls';
import PubSectionNav from 'components/PubSectionNav/PubSectionNav';
import DiscussionList from 'components/DiscussionList/DiscussionList';
import { dispatchEmptyTransaction, docIsEmpty, marksAtSelection } from '@pubpub/editor';
import queryString from 'query-string';
import { apiFetch, hydrateWrapper, getFirebaseConfig, nestDiscussionsToThreads, getRandomColor, generateHash } from 'utilities';

require('@firebase/auth');
require('@firebase/database');
require('./pub.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
};

class Pub extends Component {
	constructor(props) {
		super(props);
		const loginData = props.loginData;
		const loginId = loginData.id || `anon-${Math.floor(Math.random() * 9999)}`;
		const userColor = getRandomColor(loginId);
		this.localUser = {
			id: loginId,
			backgroundColor: `rgba(${userColor}, 0.2)`,
			cursorColor: `rgba(${userColor}, 1.0)`,
			image: loginData.avatar || null,
			name: loginData.fullName || 'Anonymous',
			initials: loginData.initials || '?',
			canEdit: props.pubData.isDraftEditor || props.pubData.isManager,
			firebaseToken: props.pubData.firebaseToken,
		};

		this.state = {
			pubData: {
				...this.props.pubData,
				sectionsData: this.props.pubData.isDraft ? [{ id: '', order: 0, title: 'Introduction' }] : undefined
			},
			locationData: this.props.locationData,
			activeCollaborators: [this.localUser],
			optionsMode: undefined,
			collabStatus: 'connecting',
			activeThreadNumber: undefined,
			initialDiscussionContent: undefined,
			scrolledToPermanent: false,
			// sectionsData: [{ id: '', order: 0, title: 'Introduction' }],
			menuWrapperRefNode: undefined,
			editorChangeObject: {},
			clickedMarks: [],
			linkPopupIsOpen: false,
		};
		this.firebaseRef = null;
		this.pageRef = React.createRef();
		this.sideMarginRef = React.createRef();
		this.setSavingTimeout = null;
		this.getHighlightContent = this.getHighlightContent.bind(this);
		this.getActiveDiscussionChannel = this.getActiveDiscussionChannel.bind(this);
		this.setActiveThread = this.setActiveThread.bind(this);
		this.setOptionsMode = this.setOptionsMode.bind(this);
		this.setPubData = this.setPubData.bind(this);
		this.setDiscussionChannel = this.setDiscussionChannel.bind(this);
		this.getAbsolutePosition = this.getAbsolutePosition.bind(this);
		this.handleSectionsChange = this.handleSectionsChange.bind(this);
		this.handleMenuWrapperRef = this.handleMenuWrapperRef.bind(this);
		this.handleNewHighlightDiscussion = this.handleNewHighlightDiscussion.bind(this);
		this.handleStatusChange = this.handleStatusChange.bind(this);
		this.handleClientChange = this.handleClientChange.bind(this);
		this.handlePutLabels = this.handlePutLabels.bind(this);
		this.closeThreadOverlay = this.closeThreadOverlay.bind(this);
		this.handlePostDiscussion = this.handlePostDiscussion.bind(this);
		this.handlePutDiscussion = this.handlePutDiscussion.bind(this);
		this.handleEditorChange = this.handleEditorChange.bind(this);
		this.handleEditorSingleClick = this.handleEditorSingleClick.bind(this);
		this.handleQuotePermalink = this.handleQuotePermalink.bind(this);
		this.calculateLinkPopupState = this.calculateLinkPopupState.bind(this);
		this.handleKeyPressEvents = this.handleKeyPressEvents.bind(this);
		this.getThreads = this.getThreads.bind(this);
	}

	componentDidMount() {
		if (this.state.pubData.isDraft) {
			/* Setup Firebase App */
			const firebaseAppName = `Pub-${this.props.pubData.editorKey}`;
			const existingApp = firebase.apps.reduce((prev, curr)=> {
				if (curr.name === firebaseAppName) { return curr; }
				return prev;
			}, undefined);
			const firebaseApp = existingApp || firebase.initializeApp(getFirebaseConfig(), firebaseAppName);
			const database = firebase.database(firebaseApp);
			firebase.auth(firebaseApp).signInWithCustomToken(this.props.pubData.firebaseToken)
			.then(()=> {
				this.firebaseRef = database.ref(`${this.props.pubData.editorKey}`);
				/* Add listener event to update sectionsData when it changes in Firebase */
				this.firebaseRef.child('/sections').on('value', this.handleSectionsChange);
			});
			window.addEventListener('keydown', this.handleKeyPressEvents);
		}
	}

	componentWillUnmount() {
		if (this.firebaseRef) {
			this.firebaseRef.child('/sections').off('value', this.handleSectionsChange);
		}
		if (this.state.pubData.isDraft) {
			window.removeEventListener('keydown', this.handleKeyPressEvents);
		}
	}

	getActiveDiscussionChannel() {
		return this.state.pubData.discussionChannels.reduce((prev, curr)=> {
			if (this.state.locationData.query.channel === curr.title) { return curr; }
			return prev;
		}, undefined);
	}

	getHighlightContent(from, to) {
		const primaryEditorState = this.state.editorChangeObject.view.state;
		if (!primaryEditorState || primaryEditorState.doc.nodeSize < from || primaryEditorState.doc.nodeSize < to) { return {}; }
		const exact = primaryEditorState.doc.textBetween(from, to);
		const prefix = primaryEditorState.doc.textBetween(Math.max(0, from - 10), Math.max(0, from));
		const suffix = primaryEditorState.doc.textBetween(Math.min(primaryEditorState.doc.nodeSize - 2, to), Math.min(primaryEditorState.doc.nodeSize - 2, to + 10));
		const hasSections = this.state.pubData.isDraft
			? this.state.pubData.sectionsData.length > 1
			: Array.isArray(this.state.pubData.versions[0].content);
		const sectionId = hasSections ? this.props.locationData.params.sectionId || '' : undefined;
		const highlightObject = {
			exact: exact,
			prefix: prefix,
			suffix: suffix,
			from: from,
			to: to,
			version: this.state.pubData.isDraft ? undefined : this.props.pubData.versions[0].id,
			section: hasSections ? sectionId : undefined,
			id: `h${generateHash(8)}`, // Has to start with letter since it's a classname
		};
		return highlightObject;
	}

	setActiveThread(threadNumber, /* highlightNode */) {
		// TODO: set highlight node
		this.setState({
			activeThreadNumber: threadNumber,
		});
	}

	setOptionsMode(mode) {
		this.setState({ optionsMode: mode });
	}

	setPubData(newPubData) {
		this.setState({ pubData: newPubData });
		if (typeof document !== 'undefined') {
			document.title = this.state.pubData.title;
		}
	}

	getAbsolutePosition(top, left, placeInSideMargin) {
		const sideContainer = this.sideMarginRef.current;

		/* The editorObject does not refresh on scroll - so we need to calculate the */
		/* y offset as 'the location of the highlight and the moment of update */
		return {
			top: top + this.state.editorChangeObject.currentScroll,
			left: placeInSideMargin
				? sideContainer.getBoundingClientRect().left
				: left,
			width: placeInSideMargin
				? sideContainer.getBoundingClientRect().width
				: undefined,
		};
	}

	getThreads() {
		const pubData = this.state.pubData;
		const discussions = pubData.discussions || [];
		const activeDiscussionChannel = this.getActiveDiscussionChannel();
		const threads = nestDiscussionsToThreads(discussions).filter((thread)=> {
			const activeDiscussionChannelId = activeDiscussionChannel ? activeDiscussionChannel.id : null;
			return activeDiscussionChannelId === thread[0].discussionChannelId;
		});
		return threads;
	}

	setDiscussionChannel(channelTitle) {
		this.setState((prevState)=> {
			const newQuery = {
				...prevState.locationData.query,
				channel: channelTitle === 'public' ? undefined : channelTitle,
			};
			const newQueryString = Object.values(newQuery).filter(item => !!item).length
				? `?${queryString.stringify(newQuery)}`
				: '';
			return {
				locationData: {
					...prevState.locationData,
					query: newQuery,
					queryString: newQueryString
				}
			};
		}, ()=> {
			dispatchEmptyTransaction(this.state.editorChangeObject.view);
			window.history.replaceState({}, '', `${this.state.locationData.path}${this.state.locationData.queryString}`);
		});
	}

	handleKeyPressEvents(evt) {
		if (this.state.linkPopupIsOpen && (evt.key === 'Escape' || evt.key === 'Enter')) {
			evt.preventDefault();
			this.setState({ linkPopupIsOpen: false }, ()=> {
				this.state.editorChangeObject.view.focus();
			});
		}
		if (evt.key === 'k' && evt.metaKey) {
			this.setState({ linkPopupIsOpen: true }, ()=> {
				this.calculateLinkPopupState();
			});
		}
	}

	handleSectionsChange(snapshot) {
		const snapshotVal = snapshot.val() || this.state.pubData.sectionsData;
		const snapshotArray = Object.keys(snapshotVal).map((key)=> {
			return {
				...snapshotVal[key],
				firebaseId: key,
			};
		});
		const newSectionsData = snapshotArray.length
			? snapshotArray.sort((foo, bar)=> {
				if (foo.order < bar.order) { return -1; }
				if (foo.order > bar.order) { return 1; }
				return 0;
			})
			: [];
		this.setPubData({
			...this.state.pubData,
			sectionsData: newSectionsData,
		});
	}

	handleQuotePermalink(quoteObject) {
		const hasChapters = !!quoteObject.section;
		const chapterString = hasChapters ? `/content/${quoteObject.section}` : '';
		const toFromString = `?to=${quoteObject.to}&from=${quoteObject.from}`;
		const versionString = quoteObject.version ? `&version=${quoteObject.version}` : '';
		const permalinkPath = `/pub/${this.props.pubData.slug}${chapterString}${toFromString}${versionString}`;
		window.open(permalinkPath);
	}

	handleMenuWrapperRef(ref) {
		if (!this.state.menuWrapperRefNode) {
			this.setState({
				menuWrapperRefNode: ref,
			});
		}
	}

	handleNewHighlightDiscussion(highlightObject) {
		this.setState({
			activeThreadNumber: 'new',
			initialDiscussionContent: {
				type: 'doc',
				attrs: { meta: {} },
				content: [
					{ type: 'highlightQuote', attrs: { ...highlightObject, id: `h${generateHash(8)}` } },
					{ type: 'paragraph', content: [] },
				]
			}
		});
	}

	handleStatusChange(status) {
		clearTimeout(this.setSavingTimeout);

		/* If loading, wait until 'connected' */
		if (this.state.collabStatus === 'connecting' && status === 'connected') {
			this.setState({ collabStatus: status });
		}
		if (this.state.collabStatus !== 'connecting' && this.state.collabStatus !== 'disconnected') {
			if (status === 'saving') {
				this.setSavingTimeout = setTimeout(()=> {
					this.setState({ collabStatus: status });
				}, 250);
			} else {
				this.setState({ collabStatus: status });
			}
		}
		/* If disconnected, only set state if the new status is 'connected' */
		if (this.state.collabStatus === 'disconnected' && status === 'connected') {
			this.setState({ collabStatus: status });
		}
	}

	handleClientChange(clients) {
		this.setState({
			activeCollaborators: [this.localUser, ...clients]
		});
	}

	handlePutLabels(newLabels) {
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				labels: newLabels,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setPubData({
				...this.state.pubData,
				...result
			});
		})
		.catch((err)=> {
			console.error('Error saving labels', err);
		});
	}

	closeThreadOverlay() {
		this.setState({
			activeThreadNumber: undefined,
			initialDiscussionContent: undefined,
		});
	}

	handlePostDiscussion(discussionObject) {
		const activeDiscussionChannel = this.getActiveDiscussionChannel();
		return apiFetch('/api/discussions', {
			method: 'POST',
			body: JSON.stringify({
				...discussionObject,
				userId: this.props.loginData.id,
				pubId: this.props.pubData.id,
				communityId: this.props.communityData.id,
				discussionChannelId: activeDiscussionChannel ? activeDiscussionChannel.id : null,
			})
		})
		.then((result)=> {
			this.setState((prevState)=> {
				return {
					activeThreadNumber: prevState.activeThreadNumber === 'new' ? result.threadNumber : prevState.activeThreadNumber,
					pubData: {
						...prevState.pubData,
						discussions: [
							...prevState.pubData.discussions,
							result,
						],
					},
				};
			}, ()=> {
				dispatchEmptyTransaction(this.state.editorChangeObject.view);
			});
		})
		.catch((err)=> {
			console.error(err);
		});
	}

	handlePutDiscussion(discussionObject) {
		return apiFetch('/api/discussions', {
			method: 'PUT',
			body: JSON.stringify({
				...discussionObject,
				communityId: this.props.communityData.id,
			})
		})
		.then((result)=> {
			this.setState((prevState)=> {
				return {
					pubData: {
						...prevState.pubData,
						discussions: prevState.pubData.discussions.map((item)=> {
							if (item.id !== result.id) { return item; }
							return {
								...item,
								...result,
							};
						}),
					},
				};
			});
		});
	}

	handleEditorChange(changeObject) {
		if (!this.state.editorChangeObject.view) {
			/* Sometimes the bounding boxes need updating */
			/* after initial load. */
			setTimeout(()=> {
				dispatchEmptyTransaction(this.state.editorChangeObject.view);
			}, 1000);

			/* Uncomment the follwing line and the import at the top */
			/* if you need to debug a pub document. */
			// applyDevTools(changeObject.view);
		}
		this.setState({
			editorChangeObject: {
				...changeObject,
				currentScroll: window.scrollY,
			},
			clickedMarks: [],
		}, this.calculateLinkPopupState);
	}

	handleEditorSingleClick(view) {
		this.setState({
			clickedMarks: marksAtSelection(view)
		}, this.calculateLinkPopupState);
	}

	calculateLinkPopupState() {
		this.setState((prevState)=> {
			const activeLink = prevState.editorChangeObject.activeLink || {};
			const selectionIsLink = !!activeLink.attrs;
			const clickedOnLink = prevState.clickedMarks.indexOf('link') > -1;
			// const linkPopupIsOpen = clickedOnLink || (prevState.linkPopupIsOpen && selectionIsLink) || (selectionIsLink && !activeLink.attrs.href);
			const linkPopupIsOpen = clickedOnLink || (prevState.linkPopupIsOpen && selectionIsLink);
			return {
				linkPopupIsOpen: linkPopupIsOpen,
			};
		});
	}

	render() {
		const pubData = this.state.pubData;
		const loginData = this.props.loginData;
		const queryObject = this.props.locationData.query;
		// const mode = this.props.locationData.params.mode;
		// const subMode = this.props.locationData.params.subMode;
		const activeVersion = pubData.activeVersion;
		const discussions = pubData.discussions || [];
		const activeDiscussionChannel = this.getActiveDiscussionChannel();
		const threads = nestDiscussionsToThreads(discussions).filter((thread)=> {
			const activeDiscussionChannelId = activeDiscussionChannel ? activeDiscussionChannel.id : null;
			return activeDiscussionChannelId === thread[0].discussionChannelId;
		});
		// console.log('Threads in render is ', threads);
		/* The activeThread can either be the one selected in state, */
		/* or one hardcoded in the URL */
		// const activeThread = threads.reduce((prev, curr)=> {
		// 	if (
		// 		curr[0].threadNumber === Number(this.props.locationData.params.subMode) ||
		// 		curr[0].threadNumber === Number(this.state.activeThreadNumber)
		// 	) {
		// 		return curr;
		// 	}
		// 	return prev;
		// }, undefined);

		/* Section variables */
		const hasSections = pubData.isDraft
			? this.state.pubData.sectionsData.length > 1
			: activeVersion && Array.isArray(activeVersion.content);
		const sectionId = this.props.locationData.params.sectionId || '';

		/* Active Content */
		let activeContent;
		if (!pubData.isDraft) {
			activeContent = !hasSections
				? (activeVersion && activeVersion.content)
				: activeVersion.content.reduce((prev, curr)=> {
					if (curr.id === sectionId) { return curr.content; }
					return prev;
				}, activeVersion.content[0].content);
		}

		/* Get Highlights from discussions. Filtering for */
		/* only highlights that are active in the current section */
		/* and not archived. */
		const highlights = discussions.filter((item)=> {
			return !item.isArchived && item.highlights;
		}).filter((item)=> {
			const activeDiscussionChannelId = activeDiscussionChannel ? activeDiscussionChannel.id : null;
			return activeDiscussionChannelId === item.discussionChannelId;
		}).reduce((prev, curr)=> {
			const highlightsWithThread = curr.highlights.map((item)=> {
				return { ...item, threadNumber: curr.threadNumber };
			});
			return [...prev, ...highlightsWithThread];
		}, [])
		.filter((highlight)=> {
			if (!hasSections) { return true; }
			return sectionId === highlight.section;
		});

		/* Add a permalink highlight if the URL mandates one */
		const hasPermanentHighlight = pubData.isDraft
			? typeof window !== 'undefined' && this.state.editorChangeObject.view && queryObject.from && queryObject.to
			: typeof window !== 'undefined' && this.state.editorChangeObject.view && queryObject.from && queryObject.to && queryObject.version;
		if (hasPermanentHighlight) {
			highlights.push({
				...this.getHighlightContent(Number(queryObject.from), Number(queryObject.to)),
				permanent: true,
			});
			if (!this.state.scrolledToPermanent) {
				setTimeout(()=> {
					const thing = document.getElementsByClassName('permanent')[0];
					if (thing) {
						window.scrollTo(0, thing.getBoundingClientRect().top - 135);
						this.setState({ scrolledToPermanent: true });
					}
				}, 100);
			}
		}

		const isCollabLoading = pubData.isDraft && !this.state.editorChangeObject.isCollabLoaded;
		const isEmptyDoc = this.state.editorChangeObject.view && docIsEmpty(this.state.editorChangeObject.view.state.doc);
		// const shortcutValues = this.state.editorChangeObject.shortcutValues || {};
		const isMobile = checkIfMobile();

		return (
			<div id="pub-container" ref={this.pageRef}>
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
				>
					<PubHeader
						pubData={pubData}
						communityData={this.props.communityData}
						locationData={this.props.locationData}
						setOptionsMode={this.setOptionsMode}
						setPubData={this.setPubData}
						activeDiscussionChannel={activeDiscussionChannel}
						setDiscussionChannel={this.setDiscussionChannel}
					/>

					<div>
						{pubData.isDraft &&
							<PubDraftHeader
								pubData={pubData}
								loginData={loginData}
								editorChangeObject={this.state.editorChangeObject}
								setOptionsMode={this.setOptionsMode}
								bottomCutoffId="discussions"
								onRef={this.handleMenuWrapperRef}
								collabStatus={this.state.collabStatus}
								activeCollaborators={this.state.activeCollaborators}
								threads={threads}
							/>
						}

						<div className="container pub">
							<div className="row">
								<div className="col-12 pub-columns">
									<div className="main-content">
										{isCollabLoading &&
											<PubLoadingBars />
										}

										{/* Prev/Content/Next Buttons */}
										{!isCollabLoading && hasSections &&
											<PubSectionNav
												pubData={pubData}
												queryObject={queryObject}
												hasSections={hasSections}
												sectionId={sectionId}
												setOptionsMode={this.setOptionsMode}
											/>
										}

										<div style={isCollabLoading ? { opacity: 0 } : {}}>
											<PubBody
												showWorkingDraftButton={!pubData.isDraft && (pubData.isEditor || pubData.isManager)}
												isDraft={pubData.isDraft}
												versionId={activeVersion && activeVersion.id}
												sectionId={sectionId}
												content={activeContent}
												threads={threads}
												slug={pubData.slug}
												highlights={highlights}
												hoverBackgroundColor={this.props.communityData.accentMinimalColor}
												setActiveThread={this.setActiveThread}
												onChange={this.handleEditorChange}
												onSingleClick={this.handleEditorSingleClick}

												// Props from CollabEditor
												editorKey={`${this.props.pubData.editorKey}${sectionId ? '/' : ''}${sectionId || ''}`}
												isReadOnly={!pubData.isDraft || (!pubData.isManager && !pubData.isDraftEditor)}
												clientData={this.state.activeCollaborators[0]}
												onClientChange={this.handleClientChange}
												onStatusChange={this.handleStatusChange}
												discussionNodeOptions={{
													// getThreads: this.getThreads,
													getThreads: ()=> { return this.getThreads(); },
													// getThreads: ()=> { return ()=>{ return threads; }; },
													// getThreads: function() { return threads; },
													getPubData: ()=> { return pubData; },
													getLocationData: ()=> { return this.props.locationData; },
													getLoginData: ()=> { return loginData; },
													getOnPostDiscussion: ()=> { return this.handlePostDiscussion; },
													getOnPutDiscussion: ()=> { return this.handlePutDiscussion; },
													getGetHighlightContent: ()=> { return this.getHighlightContent; },
													getHandleQuotePermalink: ()=> { return this.handleQuotePermalink; },
												}}
												// menuWrapperRefNode={this.state.menuWrapperRefNode}
											/>
										</div>

										{!isCollabLoading && isEmptyDoc && pubData.isDraft && (pubData.isEditor || pubData.isManager) &&
											<PubInlineImport
												editorView={this.state.editorChangeObject.view}
											/>
										}

										{/* Prev/Content/Next Buttons */}
										{!isCollabLoading && hasSections &&
											<PubSectionNav
												pubData={pubData}
												queryObject={queryObject}
												hasSections={hasSections}
												sectionId={sectionId}
												setOptionsMode={this.setOptionsMode}
											/>
										}

										{/* License */}
										{!pubData.isDraft &&
											<PubLicense />
										}
									</div>
									<div className="side-content" ref={this.sideMarginRef}>
										{/* Table of Contents */}
										<PubSideToc
											pubData={pubData}
											activeContent={activeContent}
											editorChangeObject={this.state.editorChangeObject}
										/>

										{/* Collaborators */}
										<PubSideCollaborators
											pubData={pubData}
											setOptionsMode={this.setOptionsMode}
										/>

										{/* Quick Options */}
										{/* <PubSideOptions
											pubData={pubData}
											communityData={this.props.communityData}
											setOptionsMode={this.setOptionsMode}
											activeDiscussionChannel={activeDiscussionChannel}
											setDiscussionChannel={this.setDiscussionChannel}
										/> */}
										<PubSideDiscussions
											key={activeDiscussionChannel ? activeDiscussionChannel.id : 'public-channel'}
											threads={threads}
											pubData={pubData}
											locationData={this.state.locationData}
											editorChangeObject={this.state.editorChangeObject}
											loginData={this.props.loginData}
											onPostDiscussion={this.handlePostDiscussion}
											onPutDiscussion={this.handlePutDiscussion}
											getHighlightContent={this.getHighlightContent}
											activeThread={this.state.activeThreadNumber}
											setActiveThread={this.setActiveThread}
											activeDiscussionChannel={activeDiscussionChannel}
											initialContent={this.state.initialDiscussionContent}
											getAbsolutePosition={this.getAbsolutePosition}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div id="discussions" className="discussions">
						<div className="container pub">
							<div className="row">
								<div className="col-12">
									<DiscussionList
										pubData={pubData}
										loginData={this.props.loginData}
										threads={threads}
										locationData={this.state.locationData}
										onLabelsSave={this.handlePutLabels}
										onPostDiscussion={this.handlePostDiscussion}
										onPutDiscussion={this.handlePutDiscussion}
										getHighlightContent={this.getHighlightContent}
										activeDiscussionChannel={activeDiscussionChannel}
										setDiscussionChannel={this.setDiscussionChannel}
										handleQuotePermalink={this.handleQuotePermalink}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Components that render overlays */}
					{!this.state.linkPopupIsOpen && !isMobile &&
						<PubInlineMenu
							pubData={pubData}
							editorChangeObject={this.state.editorChangeObject}
							getAbsolutePosition={this.getAbsolutePosition}
							onNewHighlightDiscussion={this.handleNewHighlightDiscussion}
							sectionId={sectionId}
							openLinkMenu={()=> {
								this.setState({ linkPopupIsOpen: true });
							}}
						/>
					}
					{this.state.linkPopupIsOpen && !isMobile &&
						<PubLinkMenu
							// key={`${this.state.editorChangeObject.selection.from}-${this.state.editorChangeObject.selection.to}`}
							pubData={pubData}
							editorChangeObject={this.state.editorChangeObject}
							getAbsolutePosition={this.getAbsolutePosition}
						/>
					}

					{/* <PubSideControls
						pubData={pubData}
						threads={threads}
						editorChangeObject={this.state.editorChangeObject}
						getAbsolutePosition={this.getAbsolutePosition}
					/> */}
					<PubOptions
						communityData={this.props.communityData}
						pubData={pubData}
						loginData={loginData}
						locationData={this.props.locationData}
						firebaseRef={this.firebaseRef}
						editorView={this.state.editorChangeObject.view}
						optionsMode={this.state.optionsMode}
						setOptionsMode={this.setOptionsMode}
						setPubData={this.setPubData}
					/>
				</PageWrapper>
			</div>
		);
	}
}

Pub.propTypes = propTypes;
export default Pub;

hydrateWrapper(Pub);
