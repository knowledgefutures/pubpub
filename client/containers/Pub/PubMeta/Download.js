import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Intent } from '@blueprintjs/core';
import { getCollabJSONs } from '@pubpub/editor';
import dateFormat from 'dateformat';
import { FileUploadButton } from 'components';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { apiFetch } from 'utils';

require('./download.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	editorView: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	setPubData: PropTypes.func.isRequired,
	// TODO: we should pass in content in the case that we are in the working draft
	// or maybe just a reference to the function to get draft content.
};

const Download = (props) => {
	const [isLoading, setIsLoading] = useState(false);
	const [selectedType, setSelectedType] = useState({ format: 'pdf', title: 'PDF' });
	const [taskId, setTaskId] = useState(undefined);
	const { communityData } = useContext(PageContext);

	// class Download extends Component {
	// constructor(props) {
	// 	super(props);
	// 	this.state = {
	// 		isLoading: false,
	// 		type: { format: 'pdf', title: 'PDF' },
	// 		taskId: undefined,
	// 	};
	// 	this.getDraftContent = this.getDraftContent.bind(this);
	// 	this.handleExport = this.handleExport.bind(this);
	// 	this.updateDownloads = this.updateDownloads.bind(this);
	// 	this.checkTask = this.checkTask.bind(this);
	// 	this.getExistingDownload = this.getExistingDownload.bind(this);
	// 	this.getFormattedDownload = this.getFormattedDownload.bind(this);
	// }

	const updateDownloads = (type, fileUrl) => {
		if (type !== 'formatted' && !props.pubData.activeVersion.id) {
			return null;
		}
		const downloadItem = {
			type: type,
			url: fileUrl,
			versionId: type === 'formatted' ? undefined : props.pubData.activeVersion.id,
			createdAt: new Date(),
		};
		const prevDownloads = props.pubData.downloads || [];
		const newDownloads = [...prevDownloads, downloadItem];
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				downloads: newDownloads,
				pubId: props.pubData.id,
				communityId: communityData.id,
			}),
		})
			.then(() => {
				props.setPubData({
					...props.pubData,
					downloads: newDownloads,
				});
			})
			.catch((err) => {
				console.error('Error Saving Pub Downloads: ', err);
			});
	};

	const checkTask = () => {
		return apiFetch(`/api/workerTasks?workerTaskId=${taskId}`)
			.then((taskData) => {
				if (taskData.isProcessing) {
					setTimeout(() => {
						checkTask();
					}, 1500);
				} else {
					setIsLoading(false);
					setTaskId(undefined);
					// this.setState({
					// 	isLoading: false,
					// 	taskId: undefined,
					// });
					window.open(taskData.output.url);
					updateDownloads(selectedType.format, taskData.output.url);
				}
			})
			.catch(() => {
				setIsLoading(false);
				// this.setState({ isLoading: false });
			});
	};

	const getDraftContent = () => {
		if (!props.pubData.isDraft) {
			return new Promise((resolve) => {
				resolve(undefined);
			});
		}

		const sectionsData = props.pubData.sectionsData;
		const editorRefs = sectionsData.map((item) => {
			return `${props.pubData.editorKey}/${item.id}`;
		});

		return getCollabJSONs(props.editorView, editorRefs)
			.then((content) => {
				const newContent =
					content.length === 1
						? content[0]
						: content.map((item, index) => {
								return {
									title: sectionsData[index].title,
									id: sectionsData[index].id,
									content: item,
								};
						  });
				return newContent;
			})
			.catch((err) => {
				console.error('Error getting draft content', err);
			});
	};

	const getFormattedDownload = () => {
		const downloads = props.pubData.downloads || [];
		const formattedDownload = downloads.reduce((prev, curr) => {
			const currIsNewer = !prev.createdAt || curr.createdAt > prev.createdAt;
			if (curr.type === 'formatted' && currIsNewer) {
				return curr;
			}
			return prev;
		}, {});
		return formattedDownload;
	};

	const getExistingDownload = () => {
		const downloads = props.pubData.downloads || [];
		return downloads.reduce((prev, curr) => {
			const sameVersion = curr.versionId === props.pubData.activeVersion.id;
			const sameType = curr.type === selectedType.format;
			if (sameType && sameVersion) {
				return curr.url;
			}
			return prev;
		}, undefined);
	};

	const handleExport = () => {
		const existingDownload = getExistingDownload();
		if (existingDownload) {
			return window.open(existingDownload);
		}
		// Check if that format is available for download, if not send off event.
		setIsLoading(true);
		// this.setState({ isLoading: true });
		return getDraftContent()
			.then((draftContent) => {
				return apiFetch('/api/export', {
					method: 'POST',
					body: JSON.stringify({
						pubId: props.pubData.id,
						versionId: props.pubData.isDraft ? 'draft' : props.pubData.activeVersion.id,
						content: draftContent,
						format: selectedType.format,
					}),
				});
			})
			.then((newTaskId) => {
				setTaskId(newTaskId);
				// this.setState({ taskId: taskId });
				setTimeout(() => {
					checkTask();
				}, 1500);
			})
			.catch(() => {
				setIsLoading(false);
				// this.setState({ isLoading: false });
			});
	};

	const formattedDownload = getFormattedDownload();
	const formattedDownloadUrl = formattedDownload.url || '';
	const formattedDownloadExtenstion = formattedDownloadUrl
		.split('.')
		.pop()
		.toLowerCase();
	const formattedDownloadDate = formattedDownload.date;
	const types = [
		{ format: 'pdf', title: 'PDF' },
		{ format: 'docx', title: 'Word' },
		{ format: 'markdown', title: 'Markdown' },
		{ format: 'epub', title: 'EPUB' },
		{ format: 'html', title: 'HTML' },
		{ format: 'odt', title: 'OpenDocument' },
		{ format: 'plain', title: 'Plain Text' },
		{ format: 'jats', title: 'JATS XML' },
		{ format: 'tex', title: 'LaTeX' },
	];
	return (
		<div className="pub-meta_download-component">
			{(props.pubData.canManage || !!formattedDownloadUrl) && (
				<div>
					<h2>Download</h2>
					<p>Default file provided by Pub manager</p>
					<div className="buttons-wrapper">
						{!!formattedDownloadUrl && (
							<div>
								<Button
									text={`Download ${formattedDownloadExtenstion.toUpperCase()}`}
									large={true}
									intent={Intent.PRIMARY}
									className="typset-button"
									onClick={() => {
										window.open(formattedDownloadUrl);
									}}
								/>
								<div className="subtext">
									Uploaded {dateFormat(formattedDownloadDate, 'mmm dd, yyyy')}
								</div>
							</div>
						)}
						{props.pubData.isManager && (
							<FileUploadButton
								onUploadFinish={(fileUrl) => {
									updateDownloads('formatted', fileUrl);
								}}
								className="typset-button"
								text="Upload new default file"
							/>
						)}
					</div>
				</div>
			)}

			<h2>Download Generated File</h2>
			<p>Auto-generated files based on article content.</p>
			<div className="bp3-button-group">
				{types.map((type) => {
					return (
						<Button
							key={type.format}
							active={selectedType.format === type.format}
							disabled={isLoading}
							onClick={() => {
								setSelectedType(type);
								// this.setState({ type: type });
							}}
							text={type.title}
						/>
					);
				})}
			</div>

			<div className="buttons-wrapper">
				<Button
					type="button"
					large={true}
					intent={Intent.PRIMARY}
					text={`Download Generated ${selectedType.title}`}
					loading={isLoading}
					onClick={handleExport}
				/>
			</div>
		</div>
	);
};

Download.propTypes = propTypes;
export default Download;
