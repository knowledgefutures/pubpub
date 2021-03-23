import React, { useState } from 'react';
import { EditorView } from 'prosemirror-view';

import { Overlay } from 'components';

import FormattingBarButton, { FormattingBarButtonProps } from './FormattingBarButton';
import Media from './media/Media';
import { insertNodeIntoEditor } from '../Editor';

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
