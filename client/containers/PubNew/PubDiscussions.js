import React, { useReducer, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { Button, Popover, Position, Menu, MenuItem } from '@blueprintjs/core';
import PubDiscussionThread from './PubDiscussionThread';
import PubDiscussionThreadNew from './PubDiscussionThreadNew';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object.isRequired,
};

const PubDiscussions = (props) => {
	const { pubData, collabData, firebaseBranchRef } = props;
	const decorations = collabData.editorChangeObject.decorations || [];
	const discussionIds = decorations
		.filter((decoration) => {
			const attrs = decoration.attrs || {};
			const className = attrs.class || '';
			return className.indexOf('discussion-range d-') > -1;
		})
		.map((decoration) => {
			const attrs = decoration.attrs || {};
			const className = attrs.class || '';
			const id = className.replace('discussion-range d-', '');
			return id;
		});

	const newDiscussionIds = decorations
		.filter((decoration) => {
			const attrs = decoration.attrs || {};
			const className = attrs.class || '';
			return className.indexOf('local-highlight lh-') > -1;
		})
		.map((decoration) => {
			const attrs = decoration.attrs || {};
			const className = attrs.class || '';
			const id = className.replace('local-highlight lh-', '');
			return id;
		});

	const [discussionsState, discussionsDispatch] = useReducer((state, action) => {
		if (action.delete) {
			const newState = { ...state };
			delete newState[action.id];
			return newState;
		}
		return {
			...state,
			[action.id]: {
				...state[action.id],
				[action.key]: action.value,
			},
		};
	}, {});

	const [groupTops, setGroupTops] = useState([]);
	useEffect(() => {
		const sortedDecorations = decorations.sort((foo, bar) => {
			if (foo.boundingBox.top < bar.boundingBox.top) {
				return -1;
			}
			if (foo.boundingBox.top > bar.boundingBox.top) {
				return 1;
			}
			return 0;
		});
		let lastTop = 0;
		const discussionTops = {};
		sortedDecorations
			.filter((decoration) => {
				return (
					decoration.attrs &&
					decoration.attrs.class &&
					decoration.attrs.class.indexOf('discussion-range') > -1
				);
			})
			.forEach((decoration) => {
				const currentTop = decoration.boundingBox.top;

				// if (lastTop && currentTop - lastTop < 100) {
				if (lastTop === currentTop) {
					discussionTops[lastTop].push(decoration);
					return null;
				}
				lastTop = currentTop;
				discussionTops[currentTop] = [decoration];
				return null;
			});
		// console.log(discussionTops);
		const newGroupTops = [];
		Object.keys(discussionTops)
			.sort((foo, bar) => {
				if (Number(foo) < Number(bar)) {
					return -1;
				}
				if (Number(foo) > Number(bar)) {
					return 1;
				}
				return 0;
			})
			// .filter((topKey) => {
			// 	return discussionTops[topKey].length > 1;
			// })
			.forEach((topKey, index, array) => {
				const ids = discussionTops[topKey].map((discussion) => {
					return discussion.attrs.class.replace('discussion-range d-', '');
				});
				const nextItemIsNear =
					index < array.length - 1 && Number(array[index + 1]) < Number(topKey) + 100;
				const isCollapsed = nextItemIsNear || ids.length > 1;
				newGroupTops.push({
					key: Number(topKey) + window.scrollY,
					ids: ids,
					isCollapsed: isCollapsed,
				});
			});

		const getCompareKey = (groupTopsArray) => {
			return groupTopsArray.reduce((prev, curr) => {
				return `${prev}${curr.key}${curr.ids.join()}`;
			}, '');
		};
		console.log(newGroupTops);
		if (getCompareKey(groupTops) !== getCompareKey(newGroupTops)) {
			setGroupTops(newGroupTops);
		}
	});

	// TODO:
	// I think what we do instead is have prosemirror include a mount point for a line-grouped
	// set of discussions. When that exists, we mount into it and don't mount the other buttons
	// Nope. We simply mount into one of existing dm- points on that line, and control it from there.
	// It'd be nice if we didn't render the button at all when there were multiple.

	// You want to calculate all the ones that are the same - and then look to see if there is
	// a following one within 100. If there are multipe - collapse. If there is one within 100, collapse
	// If there is only one, and none within a hundred - show full.

	return (
		<div className="pub-discussions-component">
			{discussionIds
				.filter((id) => {
					return document && document.getElementsByClassName(`dm-${id}`)[0];
				})
				.map((id) => {
					return ReactDOM.createPortal(
						<PubDiscussionThread
							pubData={pubData}
							collabData={collabData}
							firebaseBranchRef={firebaseBranchRef}
							discussionId={id}
							discussionState={discussionsState[id] || {}}
							dispatch={discussionsDispatch}
						/>,
						document.getElementsByClassName(`dm-${id}`)[0],
					);
				})}
			{newDiscussionIds
				.filter((id) => {
					return document && document.getElementsByClassName(`lm-${id}`)[0];
				})
				.map((id) => {
					return ReactDOM.createPortal(
						<PubDiscussionThreadNew
							pubData={pubData}
							collabData={collabData}
							firebaseBranchRef={firebaseBranchRef}
							discussionId={id}
							discussionState={discussionsState[id] || {}}
							dispatch={discussionsDispatch}
						/>,
						document.getElementsByClassName(`lm-${id}`)[0],
					);
				})}

			{groupTops.map((groupTop) => {
				return (
					<div style={{ position: 'absolute', top: groupTop.key }}>
						<Popover
							content={
								<Menu>
									{groupTop.ids.map((id, index) => {
										return (
											<MenuItem
												text={index}
												onClick={() => {
													// const id = item.replace(
													// 	'discussion-range d-',
													// 	'',
													// );
													const elem = document.querySelector(
														`.dm-${id} .bp3-button`,
													);
													elem.click();
												}}
											/>
										);
									})}
								</Menu>
							}
							target={<Button text="@" />}
							minimal={true}
							position={Position.BOTTOM}
						/>
					</div>
				);
			})}
		</div>
	);
};

PubDiscussions.propTypes = propTypes;
export default PubDiscussions;
