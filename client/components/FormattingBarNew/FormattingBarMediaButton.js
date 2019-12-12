import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Overlay } from 'components';

import FormattingBarButton from './FormattingBarButton';
import Media from './media/Media';

const propTypes = {
	editorChangeObject: PropTypes.shape({
		insertFunctions: PropTypes.object,
	}).isRequired,
	isSmall: PropTypes.bool.isRequired,
};

const FormattingBarMediaButton = React.forwardRef((props, ref) => {
	const { editorChangeObject, isSmall } = props;
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
					isSmall={isSmall}
				/>
			</Overlay>
			<div className="separator" />
			<FormattingBarButton
				{...props}
				label="Media"
				ref={ref}
				onClick={() => setModalOpen(true)}
			/>
		</>
	);
});

FormattingBarMediaButton.propTypes = propTypes;
export default FormattingBarMediaButton;
