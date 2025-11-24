import type { EditorView } from 'prosemirror-view';

import React, { useState } from 'react';

import { Overlay } from 'components';

import { insertNodeIntoEditor } from '../Editor';
import FormattingBarButton, { type FormattingBarButtonProps } from './FormattingBarButton';
import Media from './media/Media';

type FormattingBarMediaButtonProps = FormattingBarButtonProps & {
	view: EditorView;
};

const FormattingBarMediaButton = React.forwardRef((props: FormattingBarMediaButtonProps, ref) => {
	const { view, isSmall, onClick, isIndicated, isOpen, ...restProps } = props;
	const [isModalOpen, setModalOpen] = useState(false);

	const handleInsert = (type: string, attrs: Record<string, any>) => {
		insertNodeIntoEditor(view, type, attrs);
		setModalOpen(false);
	};

	return (
		<>
			<Overlay isOpen={isModalOpen} onClose={() => setModalOpen(false)} maxWidth={750}>
				<Media onInsert={handleInsert} isSmall={Boolean(isSmall)} />
			</Overlay>
			<FormattingBarButton
				{...restProps}
				ref={ref}
				isIndicated={isIndicated}
				isOpen={isOpen}
				isSmall={isSmall}
				label="Media"
				onClick={isIndicated || isOpen ? onClick : () => setModalOpen(true)}
			/>
		</>
	);
});

export default FormattingBarMediaButton;
