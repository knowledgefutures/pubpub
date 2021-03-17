import React, { useState } from 'react';

import { Overlay } from 'components';
import { EditorChangeObject } from 'components/Editor/types';

import FormattingBarButton, { FormattingBarButtonProps } from './FormattingBarButton';
import Media from './media/Media';

type FormattingBarMediaButtonProps = FormattingBarButtonProps & {
	editorChangeObject: EditorChangeObject;
};

const FormattingBarMediaButton = React.forwardRef((props: FormattingBarMediaButtonProps, ref) => {
	const { editorChangeObject, isSmall, onClick, isIndicated, isOpen, ...restProps } = props;
	const [isModalOpen, setModalOpen] = useState(false);
	const handleInsert = (insertType, insertData) => {
		const { insertFunctions } = editorChangeObject;
		if (insertFunctions) {
			insertFunctions[insertType](insertData);
		}
		setModalOpen(false);
	};

	return (
		<>
			<Overlay isOpen={isModalOpen} onClose={() => setModalOpen(false)} maxWidth={750}>
				<Media
					editorChangeObject={editorChangeObject}
					onInsert={handleInsert}
					isSmall={Boolean(isSmall)}
				/>
			</Overlay>
			<div className="separator" />
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
