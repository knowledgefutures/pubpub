import React from 'react';
import PropTypes from 'prop-types';
import PagePreview from 'components/PagePreview/PagePreview';

const propTypes = {
	content: PropTypes.object.isRequired,
	pages: PropTypes.array.isRequired,
	/* Expected content */
	/* title, pageIds */
};

const LayoutPages = function(props) {
	return (
		<div className="layout-pubs-component">
			<div className="block-content">
				<div className="container">
					{props.content.title && (
						<div className="row">
							<div className="col-12">
								<h1>{props.content.title}</h1>
							</div>
						</div>
					)}

					<div className="row">
						<div className="col-12">
							<div className="pages-wrapper">
								{props.content.pageIds
									.map((pageId) => {
										return props.pages.reduce((prev, curr) => {
											if (curr.id === pageId) {
												return curr;
											}
											return prev;
										}, undefined);
									})
									.filter((page) => {
										return !!page;
									})
									.map((page) => {
										return <PagePreview key={page.id} pageData={page} />;
									})}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

LayoutPages.propTypes = propTypes;
export default LayoutPages;
