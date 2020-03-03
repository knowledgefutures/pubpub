import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Icon, DashboardRow } from 'components';
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

const getCounts = (isCollection, content) => {
	const countReviews = isCollection
		? content.pubs.reduce((prev, curr) => {
				return prev + splitThreads(curr.threads).reviews.length;
		  }, 0)
		: splitThreads(content.threads).reviews.length;

	const countConversations = isCollection
		? content.pubs.reduce((prev, curr) => {
				return prev + splitThreads(curr.threads).discussions.length;
		  }, 0)
		: splitThreads(content.threads).discussions.length;

	const countForks = isCollection
		? content.pubs.reduce((prev, curr) => {
				const forks = splitThreads(curr.threads).forks || [];
				return prev + forks.length;
		  }, 0)
		: splitThreads(content.threads).forks.length;

	return {
		countReviews: countReviews,
		countConversations: countConversations,
		countForks: countForks,
	};
};

const getHref = (isCollection, slug, parentSlug) => {
	return getDashUrl({
		collectionSlug: isCollection ? slug : parentSlug,
		pubSlug: isCollection ? undefined : slug,
	});
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
	const authorString = generateAuthorString(content);
	const hasAuthors = content.attributions && content.attributions.some((a) => a.isAuthor);
	const slug = content.slug || content.title.toLowerCase().replace(/ /gi, '-');
	const href = !onClick && getHref(isCollection, slug, parentSlug);
	const { countConversations, countForks, countReviews } = getCounts(isCollection, content);

	const renderHandle = () => {
		return (
			dragHandleProps && (
				<div {...dragHandleProps} className="drag-handle">
					<Icon icon="drag-handle-vertical" />
				</div>
			)
		);
	};

	const renderSubtitle = () => {
		return (
			<>
				{label}
				{label && hasAuthors && ' • '}
				{authorString}
			</>
		);
	};

	const renderCounts = () => {
		if (minimal) {
			return null;
		}
		return (
			<div className="counts">
				{isCollection && (
					<div className="pubs" aria-label={`${content.pubs.length} pubs`}>
						<Icon icon="pubDoc" iconSize={14} />
						<span aria-hidden="true">{content.pubs.length}</span>
					</div>
				)}
				<div className="conversations" aria-label={`${countConversations} conversations`}>
					<Icon icon="chat2" iconSize={14} />
					<span aria-hidden="true">{countConversations}</span>
				</div>
				<div className="merges" aria-label={`${countForks} forks`}>
					<Icon icon="git-pull" iconSize={14} />
					<span aria-hidden="true">{countForks}</span>
				</div>
				<div className="reviews" aria-label={`${countReviews} reviews`}>
					<Icon icon="social-media" iconSize={14} />
					<span aria-hidden="true">{countReviews}</span>
				</div>
			</div>
		);
	};

	const renderRightSide = () => {
		return (
			<>
				{renderCounts()}
				{controls && <div className="controls">{controls}</div>}
			</>
		);
	};

	return (
		<DashboardRow
			onClick={onClick}
			className={classNames(
				'content-row-component',
				isDragging && 'is-dragging bp3-elevation-2',
				minimal && 'minimal',
			)}
			href={href}
			handle={renderHandle()}
			title={content.title}
			subtitle={renderSubtitle()}
			rightSideElements={renderRightSide()}
			icon={isCollection ? 'collection' : 'pubDoc'}
			selected={selected}
		>
			{isCollection &&
				content.pubs.map((pub) => {
					return (
						<ContentRow
							key={`${content.id}-${pub.id}`}
							content={pub}
							parentSlug={slug}
						/>
					);
				})}
		</DashboardRow>
	);
};

ContentRow.propTypes = propTypes;
ContentRow.defaultProps = defaultProps;
export default ContentRow;
