import React from 'react';
import PropTypes from 'prop-types';

import { getAllPubContributors } from 'utils/pubContributors';

const propTypes = {
	pubData: PropTypes.shape({}).isRequired,
	bylinePrefix: PropTypes.string,
	hideAuthors: PropTypes.bool,
	hideContributors: PropTypes.bool,
	linkToUsers: PropTypes.bool,
	renderEmptyState: PropTypes.func,
	renderSuffix: PropTypes.func,
};

const defaultProps = {
	bylinePrefix: 'by',
	hideAuthors: false,
	hideContributors: true,
	linkToUsers: true,
	renderEmptyState: () => null,
	renderSuffix: () => null,
};

const Byline = (props) => {
	const {
		pubData,
		bylinePrefix,
		hideAuthors,
		hideContributors,
		linkToUsers,
		renderEmptyState,
		renderSuffix,
	} = props;
	const authors = getAllPubContributors(pubData, hideAuthors, hideContributors);

	const renderContent = () => {
		return (
			<>
				{bylinePrefix && <span>{bylinePrefix} </span>}
				{authors.map((author, index) => {
					const separator =
						index === authors.length - 1 || authors.length === 2 ? '' : ', ';
					const prefix = index === authors.length - 1 && index !== 0 ? ' and ' : '';
					const user = author.user;
					if (user.slug && linkToUsers) {
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
			</>
		);
	};

	return (
		<div className="byline-component byline">
			<span className="text-wrapper">
				{authors.length > 0 && renderContent()}
				{authors.length === 0 && renderEmptyState()}
				{renderSuffix && renderSuffix()}
			</span>
		</div>
	);
};

Byline.propTypes = propTypes;
Byline.defaultProps = defaultProps;
export default Byline;
