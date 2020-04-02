import React from 'react';
import PropTypes from 'prop-types';

import { getAllPubContributors } from 'utils/pubContributors';

const propTypes = {
	emptyState: PropTypes.node,
	pubData: PropTypes.shape({}).isRequired,
	bylinePrefix: PropTypes.string,
	hideAuthors: PropTypes.bool,
	hideContributors: PropTypes.bool,
};

const defaultProps = {
	emptyState: null,
	bylinePrefix: 'by',
	hideAuthors: false,
	hideContributors: true,
};

const Byline = (props) => {
	const { pubData, emptyState, bylinePrefix, hideAuthors, hideContributors } = props;
	const authors = getAllPubContributors(pubData, hideAuthors, hideContributors);

	if (authors.length > 0) {
		return (
			<div className="byline-component byline">
				<span className="text-wrapper">
					{bylinePrefix && <span>{bylinePrefix} </span>}
					{authors.map((author, index) => {
						const separator =
							index === authors.length - 1 || authors.length === 2 ? '' : ', ';
						const prefix = index === authors.length - 1 && index !== 0 ? ' and ' : '';
						const user = author.user;
						if (user.slug) {
							return (
								<span key={`author-${user.id}`}>
									{prefix}
									<a href={`/user/${user.slug}`} className="hoverline">
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
		);
	}
	return emptyState;
};

Byline.propTypes = propTypes;
Byline.defaultProps = defaultProps;
export default Byline;
