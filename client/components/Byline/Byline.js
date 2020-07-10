import React from 'react';
import PropTypes from 'prop-types';

import ensureUserForAttribution from 'utils/ensureUserForAttribution';

export const propTypes = {
	contributors: PropTypes.oneOfType([
		// Array of authors (e.g. from pub data)
		PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})])),
		// Byline (e.g. from ExternalPublication)
		PropTypes.string,
	]).isRequired,
	bylinePrefix: PropTypes.string,
	linkToUsers: PropTypes.bool,
	renderEmptyState: PropTypes.func,
	renderSuffix: PropTypes.func,
};

export const defaultProps = {
	bylinePrefix: 'by',
	linkToUsers: true,
	renderEmptyState: () => null,
	renderSuffix: () => null,
};

const Byline = (props) => {
	const { bylinePrefix, contributors, linkToUsers, renderEmptyState, renderSuffix } = props;
	const renderContent = () => {
		return (
			<>
				{bylinePrefix && <span>{bylinePrefix} </span>}
				{typeof contributors === 'string' ? (
					<span>{contributors}</span>
				) : (
					contributors.map((author, index) => {
						const separator =
							index === contributors.length - 1 || contributors.length === 2
								? ''
								: ', ';
						const prefix =
							index === contributors.length - 1 && index !== 0 ? ' and ' : '';

						if (typeof author === 'string') {
							return (
								<span key={`author-${author}`}>
									{prefix}
									{author}
									{separator}
								</span>
							);
						}

						const { user } = ensureUserForAttribution(author);

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
					})
				)}
			</>
		);
	};

	return (
		<div className="byline-component byline">
			<span className="text-wrapper">
				{contributors.length > 0 && renderContent()}
				{contributors.length === 0 && renderEmptyState()}
				{renderSuffix && renderSuffix()}
			</span>
		</div>
	);
};

Byline.propTypes = propTypes;
Byline.defaultProps = defaultProps;
export default Byline;
