import { DOMSerializer } from 'prosemirror-model';

import Popper from 'popper.js';

require('./notePopover.scss');

const normalizePopoverString = (string) => string.split('\n').join('');

const rectUnion = (a, b) => {
	return {
		right: Math.max(a.right, b.right),
		left: Math.min(a.left, b.left),
		x: Math.min(a.x, b.x),
		bottom: Math.max(a.bottom, b.bottom),
		top: Math.min(a.top, b.top),
		y: Math.min(a.y, b.y),
	};
};

const rectContainsPoint = ({ left, right, top, bottom }, { x, y }) => {
	return x >= left && x <= right && y >= top && y <= bottom;
};

class NotePopover {
	constructor(node, view, unstructuredAttrKey) {
		const { dom, contentDOM } = DOMSerializer.renderSpec(document, node.type.spec.toDOM(node));
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom = dom;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'viewContainer' does not exist on type 'N... Remove this comment to see the full error message
		this.viewContainer = view.dom;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'contentDOM' does not exist on type 'Note... Remove this comment to see the full error message
		this.contentDOM = contentDOM;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'node' does not exist on type 'NotePopove... Remove this comment to see the full error message
		this.node = node;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'unstructuredAttrKey' does not exist on t... Remove this comment to see the full error message
		this.unstructuredAttrKey = unstructuredAttrKey;
		this.setupTooltip = this.setupTooltip.bind(this);
		this.teardownTooltip = this.teardownTooltip.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom.setAttribute('tabindex', '0');
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom.addEventListener('mouseenter', this.setupTooltip);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom.addEventListener('mousemove', this.handleMouseMove);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom.addEventListener('focus', this.setupTooltip);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom.addEventListener('blur', this.teardownTooltip);
	}

	setupTooltip() {
		this.teardownTooltip();
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'unstructuredAttrKey' does not exist on t... Remove this comment to see the full error message
		const { citation, [this.unstructuredAttrKey]: unstructuredValue } = this.node.attrs;
		const tooltip = document.createElement('div');
		tooltip.classList.add('note-popover-component', 'bp3-elevation-2');
		tooltip.innerHTML = `
            ${citation ? normalizePopoverString(citation.html) : ''}
            ${unstructuredValue ? normalizePopoverString(unstructuredValue) : ''}
        `;
		document.body.appendChild(tooltip);
		document.addEventListener('mousemove', this.handleMouseMove);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'tooltip' does not exist on type 'NotePop... Remove this comment to see the full error message
		this.tooltip = tooltip;
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'popper' does not exist on type 'NotePopo... Remove this comment to see the full error message
		this.popper = new Popper(this.dom, tooltip, {
			placement: 'top-start',
			modifiers: {
				flip: {
					behavior: 'flip',
				},
				preventOverflow: {
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'viewContainer' does not exist on type 'N... Remove this comment to see the full error message
					boundariesElement: this.viewContainer,
				},
			},
		});
	}

	handleMouseMove(evt) {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'tooltip' does not exist on type 'NotePop... Remove this comment to see the full error message
		if (this.tooltip && this.dom && document.activeElement !== this.dom) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'tooltip' does not exist on type 'NotePop... Remove this comment to see the full error message
			const tooltipRect = this.tooltip.getBoundingClientRect();
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
			const domRect = this.dom.getBoundingClientRect();
			const union = rectUnion(tooltipRect, domRect);
			const containsMouse = rectContainsPoint(union, { x: evt.clientX, y: evt.clientY });
			if (!containsMouse) {
				this.teardownTooltip();
			}
		}
	}

	teardownTooltip() {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'tooltip' does not exist on type 'NotePop... Remove this comment to see the full error message
		if (this.tooltip) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'tooltip' does not exist on type 'NotePop... Remove this comment to see the full error message
			this.tooltip.remove();
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'popper' does not exist on type 'NotePopo... Remove this comment to see the full error message
			this.popper.destroy();
		}
	}

	destroy() {
		this.teardownTooltip();
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom.removeEventListener('mouseenter', this.setupTooltip);
		document.removeEventListener('mousemove', this.handleMouseMove);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom.removeEventListener('focus', this.setupTooltip);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'dom' does not exist on type 'NotePopover... Remove this comment to see the full error message
		this.dom.removeEventListener('blur', this.teardownTooltip);
	}
}

export default NotePopover;
