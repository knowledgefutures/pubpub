import React from 'react';
import { Button, Callout } from '@blueprintjs/core';

import { collectionUrl } from 'utils/canonicalUrls';
import { withValue } from 'utils/fp';
import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';

type Props = {
	onStartWorkflow: () => unknown;
};

const StartWorkflowCallout = (props: Props) => {
	const { onStartWorkflow } = props;
	const {
		communityData,
		scopeData: {
			elements: { activeCollection },
		},
	} = usePageContext();

	const collectionDashUrl = getDashUrl({
		collectionSlug: activeCollection!.slug,
		mode: 'layout',
	});

	const collectionLink = withValue(collectionUrl(communityData, activeCollection), (url) => (
		<a href={url} target="_blank" rel="noopener noreferrer">
			{url}
		</a>
	));

	const pageLinkedToCollection = communityData.pages.find(
		(page) => page.id === activeCollection!.pageId,
	);

	return (
		<Callout
			title="Enable Submissions"
			intent={pageLinkedToCollection ? 'warning' : 'primary'}
			icon={null}
		>
			<p>
				When you enable Submissions for this Collection, anyone with a PubPub account will
				be able to visit {collectionLink} to create a Pub and submit it to this Collection.
				You'll have the chance to approve or reject these submissions before they can be
				published.
			</p>
			{!pageLinkedToCollection && <Button onClick={onStartWorkflow}>Let's do it!</Button>}
			{pageLinkedToCollection && (
				<p>
					Before you can start accepting Submissions, you'll need to unlink this
					Collection from the Page <b>{pageLinkedToCollection.title}</b> from the{' '}
					<a href={collectionDashUrl}>Layout tab</a>.
				</p>
			)}
		</Callout>
	);
};

export default StartWorkflowCallout;
