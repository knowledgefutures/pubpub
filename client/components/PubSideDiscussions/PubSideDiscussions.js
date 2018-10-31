import React, { Component } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import { Button } from '@blueprintjs/core';
import DiscussionThread from 'components/DiscussionThread/DiscussionThread';
import DiscussionInput from 'components/DiscussionInput/DiscussionInput';

require('./pubSideDiscussions.scss');

const propTypes = {
	threads: PropTypes.array.isRequired,
	pubData: PropTypes.object.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	onPostDiscussion: PropTypes.func.isRequired,
	onPutDiscussion: PropTypes.func.isRequired,
	getHighlightContent: PropTypes.func.isRequired,
	setActiveThread: PropTypes.func,
	activeThread: PropTypes.string,
	activeDiscussionChannel: PropTypes.object,
	initialContent: PropTypes.object,
	getAbsolutePosition: PropTypes.func.isRequired,
};

const defaultProps = {
	setActiveThread: undefined,
	activeThread: undefined,
	activeDiscussionChannel: { title: 'public' }, // TODO: getActiveDiscussionChannel in Pub.js should really set this
	initialContent: undefined,
};

class PubSideDiscussions extends Component {
	constructor(props) {
		super(props);

		this.state = {
			activeHighlightId: undefined,
			threadPositionData: {},
			newThreadTopPos: undefined,
		};
		this.wrapperRef = React.createRef();
		this.threadRefs = {};

		this.setPositions = this.setPositions.bind(this);
		this.handleScroll = throttle(this.setPositions.bind(this, true), 50, { leading: true, trailing: true });
	}

	componentDidMount() {
		window.addEventListener('resize', this.handleScroll);
	}

	componentDidUpdate(prevProps) {
		if (!this.props.pubData.isDraft || this.props.editorChangeObject.isCollabLoaded) {
			this.setPositions(false, prevProps);
		}
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.handleScroll);
	}

	static getDerivedStateFromProps(props, state) {
		if (state.newThreadTopPos && props.activeThread !== 'new') {
			return { newThreadTopPos: undefined };
		}
		if (!state.newThreadTopPos && props.activeThread === 'new') {
			const selectionPos = props.getAbsolutePosition(props.editorChangeObject.selectionBoundingBox.top, 0, true);
			return { newThreadTopPos: selectionPos.top };
		}
		return null;
	}

	setPositions(forceRedraw = false, prevProps) {
		const props = prevProps || this.props;
		const newThreadPositionData = { ...this.state.threadPositionData };
		let setNewData = forceRedraw;

		/* If we are expanding/collapsing a thread, we need to rerun */
		/* setPositions after the DOM has the new height of the element */
		if (props.activeThread !== this.props.activeThread) {
			setTimeout(()=> {
				this.setPositions();
			}, 0);
		}

		/* Get the heights of all elements available through threadRefs */
		/* If any height has changed or is new, set to redraw */
		Object.keys(this.threadRefs).forEach((key)=> {
			const threadRef = this.threadRefs[key];
			const newHeight = threadRef.current.offsetHeight;
			const prevThreadPositionData = newThreadPositionData[key];

			if (!prevThreadPositionData || newHeight !== prevThreadPositionData.height) {
				setNewData = true;
				newThreadPositionData[key] = {
					height: newHeight
				};
			}
		});

		/* If there are new height values, recalculate the */
		/* position values for all threads and setState() */
		if (setNewData) {
			let currentMinTop = this.wrapperRef.current
				? this.wrapperRef.current.offsetTop
				: 0;
			let offset = 0;
			let offsetIndex = Infinity;

			this.props.threads.filter((thread)=> {
				/* Filter out archived threads */
				const threadIsArchived = thread.reduce((prev, curr)=> {
					if (curr.isArchived) { return true; }
					return prev;
				}, false);
				return !threadIsArchived;
			})
			.filter((thread)=> {
				/* Filter out threads with no highlights */
				return thread[0].highlights;
			})
			.map((thread)=> {
				/* Find the bounding box for all highlights */
				/* from all threads */
				const highlightId = thread.reduce((prev, curr)=> {
					if (!prev && curr.highlights) { return curr.highlights[0].id; }
					return prev;
				}, undefined);
				const highlightBoundingBox = this.props.editorChangeObject.decorations.reduce((prev, curr)=> {
					if (!curr.attrs) { return prev; }
					if (!prev && curr.attrs.class.indexOf(highlightId) > -1) { return curr.boundingBox; }
					return prev;
				}, undefined);
				return {
					...thread,
					highlightBoundingBox: highlightBoundingBox
				};
			})
			.filter((thread)=> {
				/* Filter out all threads whose highlight */
				/* does not have a bounding box */
				return thread.highlightBoundingBox;
			})
			.sort((foo, bar)=> {
				/* Sort threads so that those with highlights earlier */
				/* in the document come first */
				if (foo.highlightBoundingBox.top < bar.highlightBoundingBox.top) { return -1; }
				if (foo.highlightBoundingBox.top > bar.highlightBoundingBox.top) { return 1; }
				return 0;
			})
			.map((thread, index)=> {
				/* Calculate the top position of threads */
				const threadRef = this.threadRefs[`${thread[0].id}Ref`];

				const offsetHeight = threadRef.current
					? threadRef.current.offsetHeight
					: 0;

				const highlightCoords = this.props.getAbsolutePosition(thread.highlightBoundingBox.top, 0, true);
				const thisTop = Math.max(highlightCoords.top, currentMinTop);
				currentMinTop = thisTop + offsetHeight;
				const isActive = this.props.activeThread === thread[0].threadNumber;
				if (isActive && thisTop !== highlightCoords.top) {
					offset = thisTop - highlightCoords.top;
					offsetIndex = index;
					currentMinTop -= offset;
				}
				newThreadPositionData[`${thread[0].id}Ref`].highlightCoords = highlightCoords;
				newThreadPositionData[`${thread[0].id}Ref`].top = thisTop;
				return thread;
			})
			.forEach((thread, index)=> {
				/* Add an offset attribute for threads that should be shifted */
				/* due to a repositioned thread 'pushing' them up. */
				if (index <= offsetIndex) {
					newThreadPositionData[`${thread[0].id}Ref`].offset = offset;
				}
			});

			this.setState({
				threadPositionData: newThreadPositionData,
			});
		}
	}

	render() {
		if (!this.props.editorChangeObject.decorations) { return null; }

		return (
			<div ref={this.wrapperRef} className="pub-side-discussions-component">
				{this.state.activeHighlightId &&
					<style>{`.${this.state.activeHighlightId} { background-color: rgba(0, 0, 0, 0.2); !important; }`}</style>
				}
				{this.props.activeThread === 'new' &&
					<div
						style={{
							position: 'absolute',
							zIndex: 18,
							...this.props.getAbsolutePosition(this.props.editorChangeObject.selectionBoundingBox.top, 0, true),
							top: this.state.newThreadTopPos,
						}}
						className="new-discussions"
					>
						<DiscussionInput
							handleSubmit={this.props.onPostDiscussion}
							// submitIsLoading={this.state.isLoadingReply}
							getHighlightContent={this.props.getHighlightContent}
							inputKey="side-new-thread"
							showTitle={false}
							activeDiscussionChannel={this.props.activeDiscussionChannel}
							initialContent={this.props.initialContent}
							isNew={true}
							leftButtons={
								<Button
									className="pt-minimal pt-small"
									onClick={()=> {
										this.props.setActiveThread(undefined);
									}}
									text="Cancel"
								/>
							}
						/>
					</div>
				}
				{this.props.threads.map((thread)=> {
					if (!this.threadRefs[`${thread[0].id}Ref`]) {
						this.threadRefs[`${thread[0].id}Ref`] = React.createRef();
					}
					const threadRef = this.threadRefs[`${thread[0].id}Ref`];

					const threadPositionData = this.state.threadPositionData[`${thread[0].id}Ref`] || {};

					const highlightId = thread.reduce((prev, curr)=> {
						if (!prev && curr.highlights) { return curr.highlights[0].id; }
						return prev;
					}, undefined);
					const isActive = this.props.activeThread === thread[0].threadNumber;
					const top = threadPositionData.top || 0;
					const thisOffset = threadPositionData.offset || 0;
					const isVisible = threadRef.current && top;
					return (
						<div
							key={`thread-${thread[0].id}`}
							ref={threadRef}
							style={{
								opacity: isVisible ? 1 : 0,
								pointerEvents: isVisible ? 'auto' : 'none',
								position: 'absolute',
								...threadPositionData.highlightCoords,
								top: top,
								transform: `translate3d(${isActive ? -20 : 0}px, -${thisOffset}px, 0)`,
								zIndex: isActive ? 18 : 'initial',
								transition: '.2s ease-in transform',
							}}
							onMouseEnter={()=> {
								this.setState({ activeHighlightId: highlightId });
							}}
							onMouseLeave={()=> {
								this.setState({ activeHighlightId: undefined });
							}}
						>
							<DiscussionThread
								thread={thread}
								isMinimal={true}
								pubData={this.props.pubData}
								locationData={this.props.locationData}
								loginData={this.props.loginData}
								onPostDiscussion={this.props.onPostDiscussion}
								onPutDiscussion={this.props.onPutDiscussion}
								getHighlightContent={this.props.getHighlightContent}
								handleQuotePermalink={this.handleQuotePermalink}
								setActiveThread={this.props.setActiveThread}
								activeThread={this.props.activeThread}
							/>
						</div>
					);
				})}
			</div>
		);
	}
}

PubSideDiscussions.propTypes = propTypes;
PubSideDiscussions.defaultProps = defaultProps;
export default PubSideDiscussions;
