export default (styleType, accentColor) => {
	/* White Blocks */
	if (styleType === 'white-blocks') {
		const whiteBlocksPrefix = '.pub-header-component.new .wrapper.white-blocks';
		return `
			${whiteBlocksPrefix} .header-collection .bp3-tag {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				border-radius: 0px;
			}
			${whiteBlocksPrefix} .collection-browser-component .bp3-button {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				border-radius: 0px;
				background: white;
			}
			${whiteBlocksPrefix} .collection-browser-component .bp3-button .bp3-icon {
				color: inherit;
			}
			${whiteBlocksPrefix} .authors, ${whiteBlocksPrefix} .authors a {
				color: ${accentColor};
			}
			${whiteBlocksPrefix} .action-button-component.large {
				color: ${accentColor};
				border: 0px solid white;
				boxShadow: 0px 2px 8px rgba(0, 0, 0, 0.2);
			}
			${whiteBlocksPrefix} .action-button-component .bp3-icon {
				color: ${accentColor};
			}
			${whiteBlocksPrefix} .action-button-component .bp3-button {
				color: ${accentColor};
			}
			${whiteBlocksPrefix} .action-button-component .bp3-button:not(.bp3-active) .action-subtext {
				color: #1f1f1f;
			}
			${whiteBlocksPrefix} .action-button-component .bp3-button.bp3-active {
				color: white;
				background-color: ${accentColor};
			}
			${whiteBlocksPrefix} .action-button-component .bp3-button.bp3-active .bp3-icon {
				color: white;
			}
		`;
	}

	/* Black Blocks */
	if (styleType === 'black-blocks') {
		const blackBlocksPrefix = '.pub-header-component.new .wrapper.black-blocks';
		return `
			${blackBlocksPrefix} .header-collection .bp3-tag {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				border-radius: 0px;
			}
			${blackBlocksPrefix} .collection-browser-component .bp3-button {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				border-radius: 0px;
			}
			${blackBlocksPrefix} .collection-browser-component .bp3-button .bp3-icon {
				color: inherit;
			}
			${blackBlocksPrefix} .authors, ${blackBlocksPrefix} .authors a {
				color: ${accentColor};
			}
			${blackBlocksPrefix} .action-button-component.large {
				color: ${accentColor};
				border: 0px solid white;
				boxShadow: 0px 2px 8px rgba(255, 255, 255, 0.2);
			}
			${blackBlocksPrefix} .action-button-component .bp3-icon {
				color: ${accentColor};
			}
			${blackBlocksPrefix} .action-button-component .bp3-button {
				color: ${accentColor};
			}
			${blackBlocksPrefix} .action-button-component .bp3-button:not(.bp3-active) .action-subtext {
				color: #bbb;
			}
			${blackBlocksPrefix} .action-button-component .bp3-button.bp3-active {
				color: black;
				background-color: ${accentColor};
			}
			${blackBlocksPrefix} .action-button-component .bp3-button.bp3-active .bp3-icon {
				color: black;
			}
		`;
	}
	return '';
};
