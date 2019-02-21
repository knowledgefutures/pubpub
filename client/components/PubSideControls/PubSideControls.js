import React, { Component } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import PubSideControlsIframe from 'components/PubSideControls/PubSideControlsIframe';
import PubSideControlsImage from 'components/PubSideControls/PubSideControlsImage';
import PubSideControlsVideo from 'components/PubSideControls/PubSideControlsVideo';
import PubSideControlsCitation from 'components/PubSideControls/PubSideControlsCitation';
import PubSideControlsFootnote from 'components/PubSideControls/PubSideControlsFootnote';
import PubSideControlsTable from 'components/PubSideControls/PubSideControlsTable';
import PubSideControlsEquation from 'components/PubSideControls/PubSideControlsEquation';
import PubSideControlsDiscussion from 'components/PubSideControls/PubSideControlsDiscussion';

require('./pubSideControls.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	threads: PropTypes.array.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
	getAbsolutePosition: PropTypes.func.isRequired,
};

class PubSideControls extends Component {
	constructor(props) {
		super(props);

		this.triggerRedraw = this.triggerRedraw.bind(this);
		this.handleScroll = throttle(this.triggerRedraw, 50, { leading: true, trailing: true });
	}

	componentDidMount() {
		window.addEventListener('resize', this.handleScroll);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.handleScroll);
	}

	triggerRedraw() {
		this.setState({});
	}

	render() {
		const isReadOnly =
			!this.props.pubData.isDraft ||
			(!this.props.pubData.isManager && !this.props.pubData.isDraftEditor);
		if (isReadOnly) {
			return null;
		}

		const selectedNode = this.props.editorChangeObject.selectedNode || {};
		const selectionBoundingBox = this.props.editorChangeObject.selectionBoundingBox || {};
		const menuItems = this.props.editorChangeObject.menuItems || [];
		const isTable = menuItems.reduce((prev, curr) => {
			if (curr.title === 'table-delete') {
				return true;
			}
			return prev;
		}, false);

		const uncontrolledNodes = [
			'paragraph',
			'blockquote',
			'horizontal_rule',
			'heading',
			'ordered_list',
			'bullet_list',
			'list_item',
			'code_block',
			'citationList',
			'footnoteList',
		];
		const isUncontrolledNode =
			selectedNode.type && uncontrolledNodes.indexOf(selectedNode.type.name) > -1;
		if (
			!this.props.pubData.isDraft ||
			isUncontrolledNode ||
			(!selectedNode.attrs && !isTable)
		) {
			return null;
		}

		const menuStyle = {
			position: 'absolute',
			...this.props.getAbsolutePosition(selectionBoundingBox.top, undefined, true),
		};

		const attrs = selectedNode.attrs;
		const updateFunc = this.props.editorChangeObject.updateNode;
		const changeNodeFunc = this.props.editorChangeObject.changeNode;
		const nodeType = selectedNode.type ? selectedNode.type.name : 'table';

		// ?Inline permalink
		const controlsProps = {
			attrs: attrs,
			updateAttrs: updateFunc,
			changeNode: changeNodeFunc,
			menuItems: menuItems,
			threads: this.props.threads,
			selectedNode: selectedNode,
			editorChangeObject: this.props.editorChangeObject,
		};
		return (
			<div className="pub-side-controls-component" style={menuStyle}>
				<div className="content-wrapper">
					{nodeType === 'iframe' && <PubSideControlsIframe {...controlsProps} />}
					{nodeType === 'image' && <PubSideControlsImage {...controlsProps} />}
					{nodeType === 'video' && <PubSideControlsVideo {...controlsProps} />}
					{nodeType === 'citation' && <PubSideControlsCitation {...controlsProps} />}
					{nodeType === 'footnote' && <PubSideControlsFootnote {...controlsProps} />}
					{nodeType === 'table' && <PubSideControlsTable {...controlsProps} />}
					{(nodeType === 'equation' || nodeType === 'block_equation') && (
						<PubSideControlsEquation {...controlsProps} />
					)}
					{nodeType === 'discussion' && <PubSideControlsDiscussion {...controlsProps} />}
				</div>
			</div>
		);
	}
}

PubSideControls.propTypes = propTypes;
export default PubSideControls;
