import React from 'react';
import PropTypes from 'prop-types';

import { Menu, MenuItem } from 'components/Menu';

const propTypes = {
	disclosure: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
	editorChangeObject: PropTypes.shape({
		menuItems: PropTypes.arrayOf(PropTypes.shape({})),
		view: PropTypes.shape({
			focus: PropTypes.func,
		}),
	}).isRequired,
	commands: PropTypes.arrayOf(
		PropTypes.shape({
			key: PropTypes.string.isRequired,
			title: PropTypes.string.isRequired,
			icon: PropTypes.string,
		}),
	).isRequired,
};

const CommandMenu = React.forwardRef((props, ref) => {
	const {
		editorChangeObject: { menuItems = [], view: editorView },
		commands,
		disclosure,
		...restProps
	} = props;

	return (
		<Menu ref={ref} {...restProps} disclosure={disclosure} menuStyle={{ zIndex: 20 }}>
			{commands.map((command) => {
				const menuItem = menuItems.find((item) => item.title === command.key) || {};
				return (
					<MenuItem
						key={command.key}
						active={menuItem.isActive}
						text={command.title}
						icon={command.icon}
						onClick={() => {
							menuItem.run();
							editorView.focus();
						}}
					/>
				);
			})}
		</Menu>
	);
});

CommandMenu.propTypes = propTypes;
export default CommandMenu;
