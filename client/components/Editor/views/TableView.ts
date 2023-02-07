// @ts-expect-error (TableView is exported by this package but not present in its .d.ts definitions)
import { TableView as BaseTableView } from 'prosemirror-tables';

import { buildLabel } from '../utils';

export class TableView extends BaseTableView {
	constructor(node, ...rest) {
		super(node, ...rest);
		this.sync(node);
	}

	update(node, decorations) {
		const shouldUpdate = super.update(node, decorations);
		this.sync(node);
		return shouldUpdate;
	}

	syncCaption(node) {
		const { dom } = this as any as { dom: HTMLElement };
		const label = buildLabel(node);
		const table = dom.querySelector('table');
		if (table) {
			const existingCaption = table.querySelector('caption');
			if (existingCaption && existingCaption.parentNode === table) {
				existingCaption.remove();
			}
			if (label) {
				const caption = document.createElement('caption');
				caption.innerHTML = label;
				table.append(caption);
			}
		}
	}

	syncAttributes(node) {
		const { id, align, size, smallerFont } = node.attrs;
		const { dom } = this as any as { dom: HTMLElement };
		dom.setAttribute('id', id);
		dom.setAttribute('data-align', align);
		dom.setAttribute('data-size', size);
		dom.setAttribute('data-smaller-font', smallerFont);
	}

	sync(node) {
		this.syncAttributes(node);
		this.syncCaption(node);
	}
}
