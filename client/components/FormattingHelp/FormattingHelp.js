import React from 'react';

const FormattingHelp = function() {
	const isMac =
		typeof navigator !== 'undefined'
			? navigator.platform.toUpperCase().indexOf('MAC') >= 0
			: false;
	const actionKey = isMac ? '⌘' : 'Ctrl+';
	const items = [
		{ id: 0, title: 'Bold', shortcut: `${actionKey}B` },
		{ id: 1, title: 'Italic', shortcut: `${actionKey}I` },
		{ id: 2, title: 'Bullet List', shortcut: '- item' },
		{ id: 3, title: 'Numbered List', shortcut: '1. item' },
	];
	const itemStyle = {
		pointerEvents: 'none',
	};
	return (
		<ul className="bp3-menu">
			<li className="bp3-menu-header">
				<h6>Formatting Shortcuts</h6>
			</li>
			{items.map((item) => {
				return (
					<li
						className="bp3-menu-item"
						key={`formatting-item-${item.id}`}
						style={itemStyle}
					>
						<span>{item.title}</span>
						<span className="bp3-menu-item-label">{item.shortcut}</span>
					</li>
				);
			})}
		</ul>
	);
};

export default FormattingHelp;
