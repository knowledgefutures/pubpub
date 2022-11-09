import { Classes } from '@blueprintjs/core';

export default (styleType, accentColor) => {
	/* White Blocks */
	if (styleType === 'white-blocks') {
		const whiteBlocksPrefix = '.pub-header-component.new .wrapper.white-blocks';
		return `
			${whiteBlocksPrefix} .header-collection .${Classes.TAG} {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				border-radius: 0px;
			}
			${whiteBlocksPrefix} .collection-browser-component .${Classes.BUTTON} {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				border-radius: 0px;
				background: white;
			}
			${whiteBlocksPrefix} .collection-browser-component .${Classes.BUTTON} .${Classes.ICON} {
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
			${whiteBlocksPrefix} .action-button-component .${Classes.ICON} {
				color: ${accentColor};
			}
			${whiteBlocksPrefix} .action-button-component .${Classes.BUTTON} {
				color: ${accentColor};
			}
			${whiteBlocksPrefix} .action-button-component .${Classes.BUTTON}:not(.${Classes.ACTIVE}) .action-subtext {
				color: #1f1f1f;
			}
			${whiteBlocksPrefix} .action-button-component .${Classes.BUTTON}.${Classes.ACTIVE} {
				color: white;
				background-color: ${accentColor};
			}
			${whiteBlocksPrefix} .action-button-component .${Classes.BUTTON}.${Classes.ACTIVE} .${Classes.ICON} {
				color: white;
			}
		`;
	}

	/* Black Blocks */
	if (styleType === 'black-blocks') {
		const blackBlocksPrefix = '.pub-header-component.new .wrapper.black-blocks';
		return `
			${blackBlocksPrefix} .header-collection .${Classes.TAG} {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				border-radius: 0px;
			}
			${blackBlocksPrefix} .collection-browser-component .${Classes.BUTTON} {
				border: 1px solid ${accentColor};
				color: ${accentColor};
				border-radius: 0px;
			}
			${blackBlocksPrefix} .collection-browser-component .${Classes.BUTTON} .${Classes.ICON} {
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
			${blackBlocksPrefix} .action-button-component .${Classes.ICON} {
				color: ${accentColor};
			}
			${blackBlocksPrefix} .action-button-component .${Classes.BUTTON} {
				color: ${accentColor};
			}
			${blackBlocksPrefix} .action-button-component .${Classes.BUTTON}:not(.${Classes.ACTIVE}) .action-subtext {
				color: #bbb;
			}
			${blackBlocksPrefix} .action-button-component .${Classes.BUTTON}.${Classes.ACTIVE} {
				color: black;
				background-color: ${accentColor};
			}
			${blackBlocksPrefix} .action-button-component .${Classes.BUTTON}.${Classes.ACTIVE} .${Classes.ICON} {
				color: black;
			}
		`;
	}
	return '';
};
