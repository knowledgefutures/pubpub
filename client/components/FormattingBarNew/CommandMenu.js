import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Menu, MenuItem } from 'components/Menu';

require('./commandMenu.scss');

const propTypes = {
	disclosure: PropTypes.oneOfType([PropTypes.func, PropTypes.node]).isRequired,
	className: PropTypes.string,
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

const defaultProps = {
	className: '',
};

const CommandMenu = React.forwardRef((props, ref) => {
	const {
		editorChangeObject: { menuItems = [], view: editorView },
		className,
		commands,
		disclosure,
		...restProps
	} = props;

	return (
		<Menu
			ref={ref}
			{...restProps}
			disclosure={disclosure}
			menuStyle={{ zIndex: 20 }}
			className={classNames('command-menu-component', className)}
		>
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
CommandMenu.defaultProps = defaultProps;
export default CommandMenu;
