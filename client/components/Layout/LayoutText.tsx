import React from 'react';
import Editor from 'components/Editor';

import { GridWrapper } from 'components';
import { LayoutBlockText } from 'utils/layout';

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
