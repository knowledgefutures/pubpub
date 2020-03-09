import React from 'react';
import PropTypes from 'prop-types';

import { getAllPubContributors } from 'utils/pubContributors';

const propTypes = {
	emptyState: PropTypes.node,
	pubData: PropTypes.shape({}).isRequired,
	showTheWordBy: PropTypes.bool,
};

const defaultProps = {
	emptyState: null,
	showTheWordBy: true,
};

const Byline = (props) => {
	const { pubData, emptyState, showTheWordBy } = props;
	const authors = getAllPubContributors(pubData, true);

	if (authors.length > 0) {
		return (
			<div className="byline-component byline">
				<span className="text-wrapper">
					{showTheWordBy && <span>by </span>}
					{authors.map((author, index) => {
						const separator =
							index === authors.length - 1 || authors.length === 2 ? '' : ', ';
						const prefix = index === authors.length - 1 && index !== 0 ? ' and ' : '';
						const user = author.user;
						if (user.slug) {
							return (
								<span key={`author-${user.id}`}>
									{prefix}
									<a href={`/user/${user.slug}`} className="underline-on-hover">
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
