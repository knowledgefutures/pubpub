import React from 'react';
import PropTypes from 'prop-types';
import PubPreview from 'components/PubPreview/PubPreview';

const propTypes = {
	layoutIndex: PropTypes.number.isRequired,
	content: PropTypes.object.isRequired,
	pubRenderList: PropTypes.array.isRequired,
	isLoading: PropTypes.bool.isRequired,
	/* Expected content */
	/* title, pubPreviewType, limit, pubIds, tagIds */
};

const LayoutPubs = function(props) {
	const pubPreviewType = props.content.pubPreviewType;
	const displayLimit = props.content.limit || Math.max(4, props.pubRenderList.length);
	const emptyPreviews = [];
	for (let index = 0; index < displayLimit; index += 1) {
		emptyPreviews.push(null);
	}
	const previews = [...props.content.pubIds, ...emptyPreviews].slice(0, displayLimit);
	// const selectOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	// const dataAvailable = props.pubRenderList.reduce((prev, curr)=> {
	// 	if (curr.slug) { return true; }
	// 	return prev;
	// }, false);
	/* Show limit when loading */
	/* Once data is loaded, only show blocks if there was a pub available */
	const renderItems = previews.filter((item, index)=> {
		const pub = props.pubRenderList[index];
		return props.isLoading || (pub && pub.slug);
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
							const itemKey = `preview-${props.layoutIndex}-${index}`;
							return (
								<div key={itemKey} className={pubPreviewType === 'medium' ? 'col-6' : 'col-12'}>
									<PubPreview
										title={selectedPub.title}
										description={selectedPub.description}
										slug={selectedPub.slug}
										versions={selectedPub.versions}
										isDraftAccessible={selectedPub.isDraftEditor || selectedPub.isDraftViewer || selectedPub.isManager}
										draftPermissions={selectedPub.draftPermissions}
										bannerImage={selectedPub.avatar}
										size={pubPreviewType}
										collaborators={selectedPub.attributions.filter((collaborator)=> {
											return !collaborator.isAuthor;
										})}
										authors={selectedPub.attributions.filter((collaborator)=> {
											return collaborator.isAuthor;
										})}
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
