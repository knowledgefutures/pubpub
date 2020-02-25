import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon } from 'components';
import { generateAuthorString } from 'components/PubPreview/pubPreviewUtils';
import { splitThreads } from 'utils';
import { getDashUrl } from 'utils/dashboard';

require('./contentRow.scss');

const propTypes = {
	content: PropTypes.object.isRequired,
	controls: PropTypes.node,
	dragHandleProps: PropTypes.object,
	isDragging: PropTypes.bool,
	label: PropTypes.node,
	minimal: PropTypes.bool,
	onClick: PropTypes.func,
	parentSlug: PropTypes.string,
	selected: PropTypes.bool,
};

const defaultProps = {
	controls: null,
	dragHandleProps: null,
	isDragging: false,
	label: null,
	onClick: null,
	parentSlug: undefined,
	minimal: false,
	selected: false,
};

const ContentRow = (props) => {
	const {
		content,
		controls,
		dragHandleProps,
		isDragging,
		label,
		onClick,
		parentSlug,
		minimal,
		selected,
	} = props;
	const isCollection = content.pubs;
	const [collectionIsOpen, setCollectionIsOpen] = useState(false);
	const authorString = generateAuthorString(content);
	const hasAuthors = content.attributions && content.attributions.some((a) => a.isAuthor);
	const showArrow = isCollection && !!content.pubs.length;
	const slug = content.slug || content.title.toLowerCase().replace(/ /gi, '-');
	const collectionReviews = isCollection
		? content.pubs.reduce((prev, curr) => {
				return prev + splitThreads(curr.threads).reviews.length;
		  }, 0)
		: splitThreads(content.threads).reviews.length;
	const collectionConversations = isCollection
		? content.pubs.reduce((prev, curr) => {
				return prev + splitThreads(curr.threads).discussions.length;
		  }, 0)
		: splitThreads(content.threads).discussions.length;
	const collectionForks = isCollection
		? content.pubs.reduce((prev, curr) => {
				const forks = splitThreads(curr.threads).forks || [];
				return prev + forks.length;
		  }, 0)
		: splitThreads(content.threads).forks.length;

	return (
		<>
			{/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
			<a
				onClick={onClick}
				draggable="false"
				className={classNames(
					'content-row-component',
					isDragging && 'is-dragging bp3-elevation-2',
					minimal && 'minimal',
					selected && 'selected',
				)}
				href={
					!onClick
						? getDashUrl({
								collectionSlug: isCollection ? slug : parentSlug,
								pubSlug: isCollection ? undefined : slug,
						  })
						: '#'
				}
			>
				{dragHandleProps && (
					<div {...dragHandleProps} className="drag-handle">
						<Icon icon="drag-handle-vertical" />
					</div>
				)}
				<div className="top">
					{!minimal && (
						<div
							className={classNames({
								arrow: true,
								active: showArrow,
								opened: collectionIsOpen,
							})}
							role="button"
							tabIndex={showArrow ? 0 : -1}
							onClick={(evt) => {
								if (isCollection) {
									evt.preventDefault();
									setCollectionIsOpen(!collectionIsOpen);
								}
							}}
						>
							{isCollection && !!content.pubs.length && <Icon icon="caret-right" />}
						</div>
					)}
					<div className="icon">
						<Icon icon={isCollection ? 'collection' : 'pubDoc'} iconSize={14} />
					</div>
					<div className="title">
						<div className="header">{content.title}</div>
						<div className="authors-and-label">
							{label}
							{label && hasAuthors && ' • '}
							{authorString}
						</div>
					</div>
					{!minimal && (
						<>
							{isCollection && (
								<div className="pubs">
									<Icon icon="pubDoc" iconSize={14} />
									{content.pubs.length}
								</div>
							)}
							<div className="conversations">
								<Icon icon="chat2" iconSize={14} />
								{collectionConversations}
							</div>
							<div className="merges">
								<Icon icon="git-pull" iconSize={14} />
								{collectionForks}
							</div>
							<div className="reviews">
								<Icon icon="social-media" iconSize={14} />
								{collectionReviews}
							</div>
						</>
					)}
					{controls && (
						// eslint-disable-next-line jsx-a11y/no-static-element-interactions
						<div
							className="controls"
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
							}}
						>
							{controls}
						</div>
					)}
				</div>
			</a>
			{isCollection && collectionIsOpen && (
				<div className="child-rows">
					{content.pubs.map((pub) => {
						return (
							<ContentRow
								key={`${content.id}-${pub.id}`}
								content={pub}
								parentSlug={slug}
							/>
						);
					})}
				</div>
			)}
		</>
	);
};

ContentRow.propTypes = propTypes;
ContentRow.defaultProps = defaultProps;
export default ContentRow;
