import React, { Component } from 'react';
import { Button, Classes, Dialog } from '@blueprintjs/core';
import { SlugStatus } from 'types';

import InputField from 'components/InputField/InputField';
import { slugifyString } from 'utils/strings';
import { getDashUrl } from 'utils/dashboard';
import { apiFetch } from 'client/utils/apiFetch';
import { getSlugError } from 'client/utils/slug';

require('./createPageDialog.scss');

type Props = {
	communityData: any;
	hostname: string;
	isOpen: boolean;
	onClose: (...args: any[]) => any;
};

type State = any;

class CreatePageDialog extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			title: '',
			slug: '',
			description: '',
			isLoading: false,
			error: undefined,
		};
		this.handleTitleChange = this.handleTitleChange.bind(this);
		this.handleSlugChange = this.handleSlugChange.bind(this);
		this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
		this.handleCreateSubmit = this.handleCreateSubmit.bind(this);
	}

	handleTitleChange(evt) {
		this.setState({ title: evt.target.value });
	}

	handleSlugChange(evt) {
		this.setState({
			slug: slugifyString(evt.target.value),
		});
	}

	handleDescriptionChange(evt) {
		this.setState({
			description: evt.target.value.substring(0, 280).replace(/\n/g, ' '),
		});
	}

	handleCreateSubmit(evt) {
		evt.preventDefault();

		const pageSlugs = this.props.communityData.pages.map((item) => {
			return item.slug;
		});
		pageSlugs.push('home');
		if (pageSlugs.indexOf(this.state.slug) > -1) {
			return this.setState({ error: 'URL already used by another Page.' });
		}

		this.setState({ isLoading: true, error: undefined });
		const newPageObject = {
			title: this.state.title,
			slug: this.state.slug,
			description: this.state.description,
		};
		return apiFetch('/api/pages', {
			method: 'POST',
			body: JSON.stringify({
				...newPageObject,
				communityId: this.props.communityData.id,
			}),
		})
			.then((newPageResult) => {
				window.location.href = getDashUrl({ mode: 'pages', subMode: newPageResult.slug });
			})
			.catch((err) => {
				const slugStatus: SlugStatus =
					err?.type === 'forbidden-slug' ? err.slugStatus : 'available';
				if (slugStatus !== 'available') {
					this.setState((currentState) => {
						const slugError = getSlugError(currentState.slug, slugStatus);
						return { isLoading: false, error: slugError };
					});
				} else {
					this.setState({
						isLoading: false,
						error: err,
					});
				}
			});
	}

	render() {
		return (
			<Dialog
				isOpen={this.props.isOpen}
				onClose={this.props.onClose}
				title="Create New Page"
				className="create-page-dialog-component"
				icon="page-layout"
			>
				<form onSubmit={this.handleCreateSubmit}>
					<div className={Classes.DIALOG_BODY}>
						<InputField
							label="Page Title"
							placeholder="Brand New Page"
							isRequired={true}
							value={this.state.title}
							onChange={this.handleTitleChange}
						/>
						<InputField
							label="Page URL"
							placeholder="my-page"
							isRequired={true}
							helperText={`${this.props.hostname}/${this.state.slug}`}
							value={this.state.slug}
							onChange={this.handleSlugChange}
						/>
						<InputField
							label="Description"
							isTextarea={true}
							value={this.state.description}
							onChange={this.handleDescriptionChange}
						/>
					</div>
					<div className={Classes.DIALOG_FOOTER}>
						<div className="footer-dialog">
							<InputField error={this.state.error}>
								<Button
									name="login"
									type="submit"
									className={`${Classes.BUTTON} ${Classes.INTENT_PRIMARY}`}
									onClick={this.handleCreateSubmit}
									text="Create Page"
									disabled={!this.state.title || !this.state.slug}
									loading={this.state.isLoading}
								/>
							</InputField>
						</div>
					</div>
				</form>
			</Dialog>
		);
	}
}
export default CreatePageDialog;
