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
		this.dom = dom;
		this.viewContainer = view.dom;
		this.contentDOM = contentDOM;
		this.node = node;
		this.unstructuredAttrKey = unstructuredAttrKey;
		this.setupTooltip = this.setupTooltip.bind(this);
		this.teardownTooltip = this.teardownTooltip.bind(this);
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.dom.setAttribute('tabindex', '0');
		this.dom.addEventListener('mouseenter', this.setupTooltip);
		this.dom.addEventListener('mousemove', this.handleMouseMove);
		this.dom.addEventListener('focus', this.setupTooltip);
		this.dom.addEventListener('blur', this.teardownTooltip);
	}

	setupTooltip() {
		this.teardownTooltip();
		const { citation, [this.unstructuredAttrKey]: unstructuredValue } = this.node.attrs;
		const tooltip = document.createElement('div');
		tooltip.classList.add('note-popover-component', 'bp3-elevation-2');
		tooltip.innerHTML = `
            ${citation ? normalizePopoverString(citation.html) : ''}
            ${unstructuredValue ? normalizePopoverString(unstructuredValue) : ''}
        `;
		document.body.appendChild(tooltip);
		document.addEventListener('mousemove', this.handleMouseMove);
		this.tooltip = tooltip;
		this.popper = new Popper(this.dom, tooltip, {
			placement: 'top-start',
			modifiers: {
				flip: {
					behavior: 'flip',
				},
				preventOverflow: {
					boundariesElement: this.viewContainer,
				},
			},
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
		if (this.tooltip) {
			this.tooltip.remove();
			this.popper.destroy();
		}
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
