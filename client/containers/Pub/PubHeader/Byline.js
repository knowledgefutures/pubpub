import React from 'react';
import PropTypes from 'prop-types';

import { getAllPubContributors } from 'utils/pubContributors';

const propTypes = {
	pubData: PropTypes.shape({}).isRequired,
};

const Byline = (props) => {
	const { pubData } = props;
	const authors = getAllPubContributors(pubData, true);

	return (
		!!authors.length && (
			<div className="byline">
				<span className="text-wrapper">
					<span>by </span>
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
		)
	);
};

Byline.propTypes = propTypes;
export default Byline;
