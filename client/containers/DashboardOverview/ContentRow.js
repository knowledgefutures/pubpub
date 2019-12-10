import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Tag, Intent } from '@blueprintjs/core';
import { Icon } from 'components';
import { generateAuthorString } from 'components/PubPreview/pubPreviewUtils';
import { getDashUrl } from 'utils/dashboard';

require('./contentRow.scss');

const propTypes = {
	content: PropTypes.object.isRequired,
	parentSlug: PropTypes.string,
};

const defaultProps = {
	parentSlug: undefined,
};

const ContentRow = (props) => {
	const { content, parentSlug } = props;
	const isCollection = content.pubs;
	const [collectionIsOpen, setCollectionIsOpen] = useState(false);
	const slug = content.slug || content.title.toLowerCase().replace(/ /gi, '-');
	const collectionReviews = isCollection
		? content.pubs.reduce((prev, curr) => {
				return prev + curr.reviews.length;
		  }, 0)
		: content.reviews.length;
	const collectionConversations = isCollection
		? content.pubs.reduce((prev, curr) => {
				return prev + curr.discussions.length;
		  }, 0)
		: content.discussions.length;
	const collectionMerges = isCollection
		? content.pubs.reduce((prev, curr) => {
				const merges = curr.merges || [];
				return prev + merges.length;
		  }, 0)
		: content.merges.length;

	return (
		<React.Fragment>
			<a
				className="content-row-component"
				href={getDashUrl({
					collectionSlug: isCollection ? slug : parentSlug,
					pubSlug: isCollection ? undefined : slug,
				})}
			>
				<div className="top">
					<div
						className={classNames({
							arrow: true,
							active: isCollection && !!content.pubs.length,
							opened: collectionIsOpen,
						})}
						role="button"
						// tabIndex needs to be removed when not visible
						tabIndex={0}
						onClick={(evt) => {
							if (isCollection) {
								evt.preventDefault();
								setCollectionIsOpen(!collectionIsOpen);
							}
						}}
					>
						{isCollection && !!content.pubs.length && <Icon icon="caret-right" />}
					</div>

					<div className="icon">
						<Icon icon={isCollection ? 'collection' : 'pubDoc'} iconSize={14} />
					</div>
					<div className="title">
						<div className="header">{content.title}</div>
						<div className="authors">{generateAuthorString(content)}</div>
					</div>
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
						{collectionMerges}
						{Math.random() < 0.3 && (
							<Tag minimal intent={Intent.SUCCESS}>
								{collectionReviews}
							</Tag>
						)}
					</div>
					<div className="reviews">
						<Icon icon="social-media" iconSize={14} />
						{collectionReviews}
						{Math.random() < 0.3 && (
							<Tag minimal intent={Intent.SUCCESS}>
								{collectionReviews}
							</Tag>
						)}
					</div>
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
		</React.Fragment>
	);
};

ContentRow.propTypes = propTypes;
ContentRow.defaultProps = defaultProps;
export default ContentRow;
