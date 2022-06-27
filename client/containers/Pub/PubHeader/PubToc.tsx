/* eslint-disable no-multi-assign */
import React from 'react';
import classNames from 'classnames';

import { Menu, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';
import { usePubContext } from '../pubHooks';

require('./pubToc.scss');

type MenuType = React.ComponentProps<typeof Menu>;

type Props = {
	children: MenuType['disclosure'];
	onSelect?: (...args: any[]) => any;
	placement?: MenuType['placement'];
	limitHeight?: boolean;
};

const PubToc = (props: Props) => {
	const { children, limitHeight, onSelect = null, placement = 'bottom-end' } = props;
	const { scopeData } = usePageContext();
	const { pubHeadings } = usePubContext({ immediate: true });
	const { canEdit, canEditDraft } = scopeData.activePermissions;

	if (pubHeadings.length === 0) {
		return null;
	}

	return (
		<Menu
			aria-label="Table of contents"
			className={classNames('pub-toc-component', limitHeight && 'limit-height')}
			disclosure={children}
			placement={placement}
		>
			{pubHeadings.map((heading) => {
				return (
					<MenuItem
						key={heading.index}
						href={`#${heading.href}`}
						className={`level-${heading.level}`}
						onClick={(evt) => {
							/* If editing, don't use anchor tags for nav since we have */
							/* a fixed header bar. Plus, the URL with an anchor tag will behave */
							/* unexpectedly on reload given the async loading of doc. Instead, */
							/* manually scroll to the position and offset by fixed header height. */
							if (onSelect) {
								onSelect();
							}
							if (canEdit || canEditDraft) {
								evt.preventDefault();
								// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
								document.getElementById(heading.href).scrollIntoView();
								const currentTop =
									document.body.scrollTop || document.documentElement.scrollTop;
								document.body.scrollTop = document.documentElement.scrollTop =
									currentTop - 75;
							}
						}}
						text={heading.title}
					/>
				);
			})}
		</Menu>
	);
};

export default PubToc;
