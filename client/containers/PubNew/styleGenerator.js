export default (styleType, accentColor) => {
	/* White Blocks */
	if (styleType === 'white-blocks') {
		return `
			.white-blocks .header-collection .bp3-tag {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				borderRadius: 0px;
			}
			.white-blocks .authors, .white-blocks .authors a {
				color: ${accentColor};
			}
			.white-blocks .pub-header-action-button-component.large {
				color: ${accentColor};
				border: 0px solid white;
				boxShadow: 0px 2px 8px rgba(0, 0, 0, 0.2);
			}
			.white-blocks .pub-header-action-button-component .bp3-icon {
				color: ${accentColor};
			}
			.white-blocks .pub-header-action-button-component .bp3-button {
				color: ${accentColor};
			}
		`;
	}

	/* Black Blocks */
	if (styleType === 'black-blocks') {
		return `
			.black-blocks .header-collection .bp3-tag {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				borderRadius: 0px;
			}
			.black-blocks .authors, .black-blocks .authors a {
				color: ${accentColor};
			}
			.black-blocks .pub-header-action-button-component.large {
				color: ${accentColor};
				border: 0px solid white;
				boxShadow: 0px 2px 8px rgba(255, 255, 255, 0.2);
			}
			.black-blocks .pub-header-action-button-component .bp3-icon {
				color: ${accentColor};
			}
			.black-blocks .pub-header-action-button-component .bp3-button {
				color: ${accentColor};
			}
		`;
	}
	return '';
};
