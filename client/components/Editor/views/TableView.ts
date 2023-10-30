import { TableView as BaseTableView } from 'prosemirror-tables';
import type { Node } from 'prosemirror-model';

import { buildLabel } from '../utils';

export class TableView extends BaseTableView {
	constructor(node: Node, cellMinWidth: number) {
		super(node, cellMinWidth);
		this.sync(node);
	}

	update(node: Node) {
		const shouldUpdate = super.update(node);
		this.sync(node);
		return shouldUpdate;
	}

	syncCaption(node: Node) {
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

	syncAttributes(node: Node) {
		const {
			id,
			suggestionKind,
			suggestionId,
			suggestionUserId,
			suggestionTimestamp,
			suggestionDiscussionId,
			suggestionOriginalAttrs,
			align,
			size,
			smallerFont,
		} = node.attrs;
		const { dom } = this as any as { dom: HTMLElement };
		dom.setAttribute('id', id);
		dom.setAttribute('data-suggestion-kind', suggestionKind);
		dom.setAttribute('data-suggestion-id', suggestionId);
		dom.setAttribute('data-suggestion-user-id', suggestionUserId);
		dom.setAttribute('data-suggestion-timestamp', suggestionTimestamp);
		dom.setAttribute('data-suggestion-discussion-id', suggestionDiscussionId);
		dom.setAttribute('data-suggestion-original-attrs', suggestionOriginalAttrs);
		dom.setAttribute('data-align', align);
		dom.setAttribute('data-size', size);
		dom.setAttribute('data-smaller-font', smallerFont);
	}

	sync(node: Node) {
		this.syncAttributes(node);
		this.syncCaption(node);
	}
}
