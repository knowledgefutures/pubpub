import type { LayoutBlockText } from 'utils/layout';

import React from 'react';

import { GridWrapper } from 'components';
import Editor from 'components/Editor';

type Props = {
	content: LayoutBlockText['content'];
};

const LayoutText = (props: Props) => {
	const { content } = props;
	if (!content.text) {
		return null;
	}
	return (
		<div className="layout-text-component">
			<div className="block-content">
				<GridWrapper>
					<Editor initialContent={content.text} isReadOnly={true} />
				</GridWrapper>
			</div>
		</div>
	);
};

export default LayoutText;
