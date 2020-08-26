import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Button, ButtonGroup, Card, Icon } from '@blueprintjs/core';

import { reanchorDiscussion } from 'components/Editor';
import { usePubContext } from 'containers/Pub/pubHooks';

require('./discussionReanchor.scss');

type Props = {
	discussionData: any;
};

const DiscussionReanchor = (props: Props) => {
	const { discussionData } = props;
	const { collabData, firebaseBranchRef } = usePubContext();
	const [isActive, setIsActive] = useState(false);

	// @ts-expect-error ts-migrate(2339) FIXME: Property 'selection' does not exist on type '{}'.
	const { selection } = collabData.editorChangeObject;
	const { anchor } = discussionData;

	const handleReanchor = () => {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
		const { view } = collabData.editorChangeObject;
		reanchorDiscussion(view, firebaseBranchRef, discussionData.id);
		setIsActive(false);
	};

	return (
		<>
			<Button
				small
				minimal
				disabled={isActive}
				onClick={() => setIsActive(true)}
				icon={<Icon icon="text-highlight" iconSize={12} />}
			>
				Re-anchor
			</Button>
			{isActive &&
				ReactDOM.createPortal(
					<Card className="discussion-reanchor-component">
						<p>Make a highlight in the document and then click "Re-anchor".</p>
						{anchor && (
							<p>
								{anchor.prefix}
								<em style={{ fontWeight: 'bold' }}>{anchor.exact}</em>
								{anchor.suffix}
							</p>
						)}
						<ButtonGroup>
							<Button onClick={() => setIsActive(false)} style={{ marginRight: 10 }}>
								Cancel
							</Button>
							<Button
								onClick={handleReanchor}
								disabled={!selection || selection.empty}
								intent="primary"
							>
								Re-anchor
							</Button>
						</ButtonGroup>
					</Card>,
					document.querySelector('body'),
				)}
		</>
	);
};
export default DiscussionReanchor;
