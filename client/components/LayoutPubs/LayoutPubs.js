import React from 'react';
import PropTypes from 'prop-types';
import PubPreview from 'components/PubPreview/PubPreview';

const propTypes = {
	content: PropTypes.object.isRequired,
	pubRenderList: PropTypes.array.isRequired,
	/* Expected content */
	/* title, pubPreviewType, limit, pubIds, tagIds, hideByline, hideDescription, hideDates, hideContributors */
};

const LayoutPubs = function(props) {
	const pubPreviewType = props.content.pubPreviewType;
	const displayLimit = props.content.limit || Math.max(4, props.pubRenderList.length);
	const emptyPreviews = [];
	for (let index = 0; index < displayLimit; index += 1) {
		emptyPreviews.push(null);
	}
	const previews = [...props.content.pubIds, ...emptyPreviews].slice(0, displayLimit);

	/* Only show blocks if there was a pub available */
	const renderItems = previews.filter((item, index)=> {
		const pub = props.pubRenderList[index];
		return pub && pub.slug;
	});
	return (
		<div className="layout-pubs-component">
			<div className="block-content">
				<div className="container">
					{props.content.title &&
						<div className="row">
							<div className="col-12">
								<h1>{props.content.title}</h1>
							</div>
						</div>
					}

					<div className="row">
						{renderItems.map((item, index)=> {
							const selectedPub = props.pubRenderList[index] || { collaborators: [] };
							return (
								<div key={selectedPub.id} className={pubPreviewType === 'medium' ? 'col-6' : 'col-12'}>
									<PubPreview
										pubData={selectedPub}
										size={pubPreviewType}
										hideByline={props.content.hideByline}
										hideDescription={props.content.hideDescription}
										hideDates={props.content.hideDates}
										hideContributors={props.content.hideContributors}
									/>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

LayoutPubs.propTypes = propTypes;
export default LayoutPubs;
