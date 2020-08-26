import React, { Component } from 'react';
import PagePreview from 'components/PagePreview/PagePreview';
import InputField from 'components/InputField/InputField';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import OrderPicker from 'components/OrderPicker/OrderPicker';
import { Popover, PopoverInteractionKind, Position } from '@blueprintjs/core';

type Props = {
	onChange: (...args: any[]) => any;
	layoutIndex: number;
	content: any;
	pages: any[];
};

class LayoutEditorPages extends Component<Props> {
	constructor(props: Props) {
		super(props);
		this.setTitle = this.setTitle.bind(this);
		this.setPageIds = this.setPageIds.bind(this);
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'orderPopoverRef' does not exist on type ... Remove this comment to see the full error message
		this.orderPopoverRef = React.createRef();
	}

	setPageIds(newPageObjects) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			pageIds: newPageObjects.map((page) => {
				return page.id;
			}),
		});
	}

	setTitle(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			title: evt.target.value,
		});
	}

	render() {
		return (
			<div className="layout-editor-pages-component">
				<div className="block-header">
					<InputField
						label="Title"
						value={this.props.content.title}
						onChange={this.setTitle}
					/>
					<InputField label="Pages">
						<Popover
							content={
								<div>
									<OrderPicker
										selectedItems={this.props.content.pageIds
											.map((pageId) => {
												return this.props.pages.reduce((prev, curr) => {
													if (curr.id === pageId) {
														return curr;
													}
													return prev;
												}, undefined);
											})
											.filter((page) => {
												return !!page;
											})}
										allItems={this.props.pages}
										onChange={this.setPageIds}
										// @ts-expect-error ts-migrate(2322) FIXME: Type 'number' is not assignable to type '(...args:... Remove this comment to see the full error message
										uniqueId={this.props.layoutIndex}
										selectedTitle="Displayed Pages"
										availableTitle="Available Pages"
									/>
								</div>
							}
							interactionKind={PopoverInteractionKind.CLICK}
							position={Position.BOTTOM_RIGHT}
							usePortal={false}
							minimal={true}
							popoverClassName="order-picker-popover"
							// @ts-expect-error ts-migrate(2322) FIXME: Property 'popoverDidOpen' does not exist on type '... Remove this comment to see the full error message
							popoverDidOpen={() => {
								setTimeout(() => {
									/* This is a hacky way to solve this bug: */
									/* https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/patterns/using-a-portal.md */
									// @ts-expect-error ts-migrate(2339) FIXME: Property 'orderPopoverRef' does not exist on type ... Remove this comment to see the full error message
									const overlayNode = this.orderPopoverRef.current.popoverElement
										.parentNode;
									const positions = overlayNode.style.transform
										.replace('translate3d(', '')
										.split(', ');
									overlayNode.style.left = positions[0];
									overlayNode.style.top = positions[1];
									overlayNode.style.transform = '';
									overlayNode.style.willChange = '';
								}, 0);
							}}
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'orderPopoverRef' does not exist on type ... Remove this comment to see the full error message
							ref={this.orderPopoverRef}
						>
							<DropdownButton label="Set pages" />
						</Popover>
					</InputField>
				</div>

				<div className="block-content">
					<div className="container">
						{this.props.content.title && (
							<div className="row">
								<div className="col-12">
									<h1>{this.props.content.title}</h1>
								</div>
							</div>
						)}

						<div className="row">
							<div className="col-12">
								<div className="pages-wrapper">
									{this.props.content.pageIds
										.map((pageId) => {
											return this.props.pages.reduce((prev, curr) => {
												if (curr.id === pageId) {
													return curr;
												}
												return prev;
											}, undefined);
										})
										.filter((page) => {
											return !!page;
										})
										.map((page) => {
											return <PagePreview key={page.id} pageData={page} />;
										})}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
export default LayoutEditorPages;
