import { DOMSerializer, Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { createPopper } from '@popperjs/core';
import linkifyHtml from 'linkifyjs/html';
import { Classes } from '@blueprintjs/core';

import { rectContainsPoint, rectUnion } from 'utils/geom';

require('./notePopover.scss');

const normalizePopoverString = (string: string) => string.split('\n').join('');

class NotePopover {
	dom: HTMLElement;
	contentDOM: HTMLElement;

	private unstructuredAttrKey: string;
	private viewContainer: HTMLElement;
	private tooltip: null | HTMLElement = null;
	private popper: null | ReturnType<typeof createPopper> = null;
	private node: Node;
	private notePopoverId: string;

	constructor(node: Node, view: EditorView, unstructuredAttrKey: string) {
		const { dom, contentDOM } = DOMSerializer.renderSpec(document, node.type.spec.toDOM!(node));
		this.dom = dom as HTMLElement;
		this.viewContainer = view.dom as HTMLElement;
		this.contentDOM = contentDOM as HTMLElement;
		this.node = node;
		this.notePopoverId = `${node.attrs.id}-note-popover`;
		this.unstructuredAttrKey = unstructuredAttrKey;
		this.setupTooltip = this.setupTooltip.bind(this);
		this.teardownTooltip = this.teardownTooltip.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);

		this.dom.setAttribute('tabindex', '0');
		this.dom.setAttribute('role', 'link');
		this.dom.setAttribute('aria-describedby', this.notePopoverId);
		this.dom.addEventListener('mouseenter', this.setupTooltip);
		this.dom.addEventListener('mousemove', this.handleMouseMove);
		this.dom.addEventListener('focus', this.setupTooltip);
		this.dom.addEventListener('blur', this.teardownTooltip);
	}

	setupTooltip() {
		this.teardownTooltip();
		const { citation, [this.unstructuredAttrKey]: unstructuredValue } = this.node.attrs;
		const tooltip = document.createElement('div');
		const linkedStructured = linkifyHtml(citation.html);
		const linkedUnstructured = linkifyHtml(unstructuredValue);
		tooltip.setAttribute('id', this.notePopoverId);
		tooltip.setAttribute('role', 'tooltip');
		tooltip.classList.add('note-popover-component', Classes.ELEVATION_2);
		tooltip.innerHTML = `
            ${citation ? normalizePopoverString(linkedStructured) : ''}
            ${unstructuredValue ? normalizePopoverString(linkedUnstructured) : ''}
        `;
		document.body.appendChild(tooltip);
		document.addEventListener('mousemove', this.handleMouseMove);
		this.tooltip = tooltip;
		this.popper = createPopper(this.dom, tooltip, {
			placement: 'top-start',
			modifiers: [
				{
					name: 'preventOverflow',
					options: {
						boundary: this.viewContainer,
					},
				},
				{
					name: 'flip',
				},
			],
		});
	}

	handleMouseMove(evt) {
		if (this.tooltip && this.dom && document.activeElement !== this.dom) {
			const tooltipRect = this.tooltip.getBoundingClientRect();
			const domRect = this.dom.getBoundingClientRect();
			const union = rectUnion(tooltipRect, domRect);
			const containsMouse = rectContainsPoint(union, { x: evt.clientX, y: evt.clientY });
			if (!containsMouse) {
				this.teardownTooltip();
			}
		}
	}

	teardownTooltip() {
		this.tooltip?.remove();
		this.popper?.destroy();
	}

	destroy() {
		this.teardownTooltip();
		this.dom.removeEventListener('mouseenter', this.setupTooltip);
		document.removeEventListener('mousemove', this.handleMouseMove);
		this.dom.removeEventListener('focus', this.setupTooltip);
		this.dom.removeEventListener('blur', this.teardownTooltip);
	}
}

export default NotePopover;
