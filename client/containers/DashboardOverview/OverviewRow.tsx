import React, { useState } from 'react';
import classNames from 'classnames';
import { Button } from 'reakit';
import dateFormat from 'dateformat';

import { Icon, PubByline } from 'components';
import { getDashUrl } from 'utils/dashboard';

require('./overviewRow.scss');

type OwnProps = {
	children?: React.ReactNode;
	content: any;
	controls?: React.ReactNode;
	dragHandleProps?: any;
	isDragging?: boolean;
	label?: React.ReactNode;
	minimal?: boolean;
	parentSlug?: string;
};

const defaultProps = {
	children: null,
	controls: null,
	dragHandleProps: null,
	isDragging: false,
	label: null,
	parentSlug: undefined,
	minimal: false,
};

const getCounts = (isCollection, content) => {
	const countReviews = isCollection
		? content.pubs.reduce((prev, curr) => {
				return prev + curr.reviews.filter((it) => it.status !== 'closed').length;
		  }, 0)
		: content.reviews.filter((it) => it.status !== 'closed').length;

	const countConversations = isCollection
		? content.pubs.reduce((prev, curr) => {
				return prev + curr.discussions.filter((it) => !it.isClosed).length;
		  }, 0)
		: content.discussions.filter((it) => !it.isClosed).length;

	const countForks = isCollection
		? content.pubs.reduce((prev, curr) => {
				const forks = curr.forks || [];
				return prev + forks.filter((it) => !it.isClosed).length;
		  }, 0)
		: content.forks.filter((it) => !it.isClosed).length;

	return {
		countReviews: countReviews,
		countConversations: countConversations,
		countForks: countForks,
	};
};

const getHref = (isCollection, slug, parentSlug) => {
	// @ts-expect-error ts-migrate(2345) FIXME: Type '{ collectionSlug: any; pubSlug: any; }' is m... Remove this comment to see the full error message
	return getDashUrl({
		collectionSlug: isCollection ? slug : parentSlug,
		pubSlug: isCollection ? undefined : slug,
	});
};

type Props = OwnProps & typeof defaultProps;

const OverviewRow = (props: Props) => {
	const {
		content,
		controls,
		dragHandleProps,
		isDragging,
		label,
		parentSlug,
		minimal,
		children,
	} = props;
	const isCollection = content.pubs;
	const hasAuthors = content.attributions && content.attributions.some((a) => a.isAuthor);
	const slug = content.slug || (content.title || '').toLowerCase().replace(/ /gi, '-');
	const href = getHref(isCollection, slug, parentSlug);
	const { countConversations, countReviews } = getCounts(isCollection, content);
	const [showChildren, setShowChildren] = useState(false);
	const showArrow = React.Children.count(children) > 0;

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
			<React.Fragment>
				{label}
				{label && hasAuthors && ' • '}
				{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message */}
				<PubByline pubData={content} linkToAuthors={false} bylinePrefix={null} />
			</React.Fragment>
		);
	};

	const renderInitialRelease = (item) => {
		if (!item.releases) {
			return '';
		}
		const releases = item.releases;
		const firstRelease = releases.reduce((prev, curr) => {
			if (!prev) {
				return curr.createdAt;
			}
			return prev < curr.createdAt ? prev : curr.createdAt;
		}, null);
		return firstRelease ? dateFormat(firstRelease, 'mmm dd, yyyy') : '-';
	};

	return (
		<div
			className={classNames(
				'overview-row-component',
				isDragging && 'is-dragging bp3-elevation-2',
				minimal && 'minimal',
			)}
			aria-expanded={showChildren}
			role={isCollection ? 'listitem' : undefined}
		>
			<div className="inner">
				<div className="handle">
					{isCollection ? (
						<Button
							aria-label={
								showChildren
									? 'Hide collection children'
									: 'Show collection children'
							}
							className={classNames({
								arrow: true,
								active: showArrow,
								opened: showChildren,
							})}
							tabIndex={showArrow ? 0 : -1}
							onClick={(evt) => {
								if (showArrow) {
									evt.preventDefault();
									setShowChildren(!showChildren);
								}
							}}
						>
							{showArrow && <Icon icon="caret-right" />}
						</Button>
					) : (
						renderHandle()
					)}
				</div>
				<div className="type">
					<Icon icon={isCollection ? 'collection' : 'pubDoc'} iconSize={14} />
				</div>
				<div className="title" draggable="false">
					<a className="item-title" href={href}>
						{content.title}
					</a>
					{!isCollection && (
						<a className="title-button" href={href.replace('/dash', '')}>
							Go to Pub
						</a>
					)}
					<div className="subtitle">{renderSubtitle()}</div>
				</div>
				<div className="pubs">{isCollection ? content.pubs.length : ''}</div>
				<div className="released">{renderInitialRelease(content)}</div>
				<div className="discussions">{countConversations}</div>
				<div className="reviews">{countReviews}</div>
				<div className="pub-options">{controls}</div>
			</div>
			{showChildren && <div className="child-rows">{children}</div>}
		</div>
	);
};
OverviewRow.defaultProps = defaultProps;
export default OverviewRow;
