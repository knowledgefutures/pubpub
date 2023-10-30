import React from 'react';

import { PubPreview } from 'components';
import { Pub } from 'types';
import { LayoutBlockPubs } from 'types/layout';
import { createReadingParamUrl } from 'client/utils/collections';

type Props = {
	content: LayoutBlockPubs['content'];
	pubs: Pub[];
	collectionId?: string;
};

const LayoutPubs = (props: Props) => {
	const { pubs, content, collectionId } = props;
	const {
		hideByline,
		hideContributors,
		hideDates,
		hideDescription,
		hideEdges,
		pubPreviewType,
		title,
	} = content;
	const isTwoColumn = ['medium', 'minimal'].includes(pubPreviewType);

	const customizePubUrlProps = collectionId
		? { customizePubUrl: (url) => createReadingParamUrl(url, collectionId) }
		: {};

	const renderPubRow = (currentPub: Pub, index: number, allPubs: Pub[]) => {
		if (isTwoColumn && index % 2 === 1) {
			return null;
		}
		const nextPub = isTwoColumn && index < allPubs.length - 1 ? allPubs[index + 1] : null;
		return (
			<div key={currentPub.id} className="row">
				<div className={isTwoColumn ? 'col-6' : 'col-12'}>
					<PubPreview
						pubData={currentPub}
						size={pubPreviewType}
						hideByline={hideByline}
						hideDescription={hideDescription}
						hideDates={hideDates}
						hideEdges={hideEdges}
						hideContributors={hideContributors}
						{...customizePubUrlProps}
					/>
				</div>
				{nextPub && (
					<div className={isTwoColumn ? 'col-6' : 'col-12'}>
						<PubPreview
							pubData={nextPub}
							size={pubPreviewType}
							hideByline={hideByline}
							hideDescription={hideDescription}
							hideDates={hideDates}
							hideEdges={hideEdges}
							hideContributors={hideContributors}
							{...customizePubUrlProps}
						/>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="block-content">
			<div className="container">
				{title && (
					<div className="row">
						<div className="col-12">
							<h1>{title}</h1>
						</div>
					</div>
				)}
				{pubs.map(renderPubRow)}
			</div>
		</div>
	);
};

export default LayoutPubs;
