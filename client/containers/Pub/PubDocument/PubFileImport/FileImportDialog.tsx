import React, { useState } from 'react';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';
import { useKeyPressEvent } from 'react-use';
import {
	Button,
	ButtonGroup,
	Callout,
	Classes,
	Drawer,
	Menu,
	MenuItem,
	NonIdealState,
	Popover,
	Spinner,
	Tooltip,
} from '@blueprintjs/core';

import { MenuConfigProvider } from 'components/Menu';
import { extensionToPandocFormat, bibliographyFormats } from 'utils/import/formats';
import { apiFetch } from 'client/utils/apiFetch';
import { pingTask } from 'client/utils/pingTask';
import { importDocJson } from 'components/Editor';

import { useFileManager } from './useFileManager';
import { extensionFor } from './formats';
import FileImportEntry from './FileImportEntry';
import MetadataEditor from './MetadataEditor';

require('./fileImportDialog.scss');

type Props = {
	updatePubData: (...args: any[]) => any;
	isOpen: boolean;
	onClose: (...args: any[]) => any;
	onClosed: (...args: any[]) => any;
	editorChangeObject: any;
};

const importerFlagNames = ['extractEndnotes', 'keepStraightQuotes', 'skipJatsBibExtraction'];
const documentExtensions = Object.keys(extensionToPandocFormat).map((ext) => `.${ext}`);
const bibliographyExtensions = bibliographyFormats.map((ext) => `.${ext}`);

const acceptedFileTypes = [
	...documentExtensions,
	...bibliographyExtensions,
	'image/*',
	'application/pdf',
].join(',');

const getFingerprintOfImportedFiles = (currentFiles) =>
	currentFiles
		.map((file) => file.clientPath + '_' + file.label)
		.sort((a, b) => a - b)
		.join('___');

const FileImportDialog = ({
	editorChangeObject,
	updatePubData,
	isOpen,
	onClose,
	onClosed,
}: Props) => {
	const { addFile, getFiles, deleteFileById, labelFileById } = useFileManager();
	const currentFiles = getFiles();
	const incompleteUploads = currentFiles.filter((file) => file.state !== 'complete');
	const hasDocumentToImport = currentFiles.some((file) => file.label === 'document');

	const [importerFlags, setImporterFlags] = useState({});
	const [importResult, setImportResult] = useState({});
	const [isImporting, setIsImporting] = useState(false);
	const [isFinalizing, setIsFinishing] = useState(false);
	const [isNerdModeShown, setIsNerdModeShown] = useState(false);
	const [lastImportedFilesFingerprint, setLastImportedFilesFingerprint] = useState('');
	const [metadataUpdater, setMetadataUpdater] = useState(null);

	const importedFilesMatchCurrentFiles =
		!!importResult &&
		lastImportedFilesFingerprint === getFingerprintOfImportedFiles(currentFiles);

	const isImportDisabled = !hasDocumentToImport || incompleteUploads.length > 0 || isImporting;
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'doc' does not exist on type '{}'.
	const { doc, warnings = [], pandocErrorOutput, error, proposedMetadata } = importResult;
	const hasProposedMetadata = proposedMetadata && Object.keys(proposedMetadata).length > 0;

	useKeyPressEvent('/', (evt) => {
		if (evt.metaKey) {
			setIsNerdModeShown(true);
		}
	});

	const handleClearImportResult = () => {
		setImportResult({});
		setMetadataUpdater(null);
	};

	const handleFinishImport = async () => {
		setIsFinishing(true);
		if (metadataUpdater) {
			// @ts-expect-error ts-migrate(2721) FIXME: Cannot invoke an object which is possibly 'null'.
			await metadataUpdater();
		}
		await importDocJson(editorChangeObject.view, doc);
		onClose();
	};

	const handleStartImportTask = () => {
		setIsImporting(true);
		apiFetch('/api/import', {
			method: 'POST',
			body: JSON.stringify({
				sourceFiles: currentFiles,
				importerFlags,
				useNewImporter: true,
			}),
		})
			.then((taskId) => pingTask(taskId, 1000))
			.then((result) => {
				setIsImporting(false);
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
				setImportResult(result);
				setLastImportedFilesFingerprint(getFingerprintOfImportedFiles(currentFiles));
			})
			.catch((err) =>
				setImportResult({ error: { message: err.toString(), stack: err.stack } }),
			);
	};

	const renderContentInDropzone = (fn) => {
		return (
			<Dropzone
				accept={acceptedFileTypes}
				onDrop={(files) => files.map(addFile)}
				children={fn}
			/>
		);
	};

	const renderFormatTooltip = () => {
		const formatsNode = (
			<ul className="supported-formats-tooltip">
				<li>
					Supports <i>documents</i> in these formats: {documentExtensions.join(', ')}. You
					can also use one or more documents as <i>supplements</i> to be passed to the
					converter, for instance if your document is a .tex file and relies on one or
					more other .tex files.
				</li>
				<li>
					Supports <i>bibliographies</i> in these formats:{' '}
					{bibliographyExtensions.join(', ')}.
				</li>
				<li>
					Supports all image formats, though you may wish to convert your images to a
					format with wide browser support (.jpeg, .jpg, .png, .svg, or .gif).
				</li>
			</ul>
		);
		return (
			<React.Fragment>
				<Tooltip content={formatsNode}>
					<span className={Classes.TOOLTIP_INDICATOR}>What can I import?</span>
				</Tooltip>
				<div className="screenreader-only">{formatsNode}</div>
			</React.Fragment>
		);
	};

	const renderImportMessage = () => {
		if (error) {
			return (
				<Callout className="import-result" title="Import error" intent="danger">
					{error.message ? error.message : error.toString()}
					{error.stack && (
						<details>
							<summary>Technical details</summary>
							<pre>{error.stack}</pre>
						</details>
					)}
				</Callout>
			);
		}
		if (doc) {
			const missingImages = warnings
				.filter((w) => w.type === 'missingImage')
				.map((w) => w.path);
			const missingCitations = warnings
				.filter((w) => w.type === 'missingCitation')
				.map((w) => w.id);
			if (missingImages.length > 0 || missingCitations.length > 0 || pandocErrorOutput) {
				return (
					<Callout
						aria-live="assertive"
						className="import-message"
						title="Import warnings"
						intent="warning"
					>
						<ul>
							{missingImages.length > 0 && (
								<li>
									<i>
										Your document contains references external images which you
										may wish to upload.
									</i>
									<details>
										<summary>Missing images</summary>
										{missingImages.join(', ')}.
									</details>
								</li>
							)}
							{missingCitations.length > 0 && (
								<li>
									<i>
										Some citations in the document could not be matched to a
										bibliography item. You may wish to upload an external
										bibliography (e.g. a .bib file).
									</i>
									<details>
										<summary>Missing citation IDs</summary>
										{missingCitations.join(', ')}.
									</details>
								</li>
							)}
							{pandocErrorOutput && (
								<li>
									<i>
										Conversion from LaTeX to HTML succeeded, with information (
										<a href="https://help.pubpub.org/pub/latex-compatibility">
											more about PubPub and LaTeX
										</a>
										):
									</i>
									<details>
										<pre>{pandocErrorOutput}</pre>
									</details>
								</li>
							)}
						</ul>
						<Button onClick={handleClearImportResult}>Add more files</Button>
					</Callout>
				);
			}
			return (
				<Callout
					aria-live="polite"
					className="import-message"
					title="Import succeeded"
					intent="success"
				/>
			);
		}
		if (
			currentFiles.length > 0 &&
			currentFiles.every((file) => extensionFor(file.clientPath) === 'pdf')
		) {
			return (
				<Callout
					aria-live="polite"
					className="import-message"
					title="PDFs are supported as images only"
					intent="primary"
				>
					PubPub does not import text content from PDFs; they may only be imported as
					images referenced from another document.
				</Callout>
			);
		}
		return null;
	};

	const renderNerdMode = () => {
		if (!isNerdModeShown) {
			return null;
		}
		return (
			<Popover
				minimal
				content={
					<Menu>
						<MenuItem
							onClick={handleStartImportTask}
							icon="refresh"
							text="Force retry import"
						/>
						<li className={Classes.MENU_HEADER}>
							<h6 className={Classes.HEADING}>Experimental flags</h6>
						</li>
						{importerFlagNames.map((flag) => {
							const isSelected = !!importerFlags[flag];
							const onToggleFlagSelected = () =>
								setImporterFlags((currentFlags) => ({
									...currentFlags,
									[flag]: !isSelected,
								}));
							return (
								<MenuItem
									key={flag}
									icon={isSelected ? 'tick' : 'blank'}
									onClick={onToggleFlagSelected}
									text={flag}
								/>
							);
						})}
					</Menu>
				}
			>
				<Button icon="flame">Extras</Button>
			</Popover>
		);
	};

	const renderDropArea = () => {
		if (isImporting) {
			return (
				<div className="in-progress">
					<Spinner size={50} className="drop-area-icon" />
					<span aria-live="assertive">Importing your document...</span>
				</div>
			);
		}
		return (
			<ButtonGroup className="drop-area-container" vertical>
				{renderContentInDropzone(({ getRootProps, getInputProps }) => (
					<React.Fragment>
						<Button {...getRootProps()} className="file-drop-area">
							<NonIdealState
								icon="paperclip"
								description={
									<React.Fragment>
										Click here or drag in files to upload them
										<div className="supported-formats">
											{renderFormatTooltip()}
										</div>
									</React.Fragment>
								}
							/>
						</Button>
						<input {...getInputProps()} multiple />
					</React.Fragment>
				))}
				{renderContentInDropzone(({ getRootProps, getInputProps }) => (
					<React.Fragment>
						<input {...getInputProps()} webkitdirectory="" />
						<Button
							{...getRootProps()}
							className="directory-drop-area"
							text="Or, click here to upload an entire directory"
						/>
					</React.Fragment>
				))}
			</ButtonGroup>
		);
	};

	const renderFileListing = () => {
		return (
			<div className="files-listing">
				<div className="screenreader-only" aria-live="polite">
					{incompleteUploads.length > 0
						? `${currentFiles.length - incompleteUploads.length} of ${
								currentFiles.length
						  } files uploaded.`
						: `${currentFiles.length} files uploaded.`}
				</div>
				{currentFiles.map((file, index) => (
					<FileImportEntry
						// eslint-disable-next-line react/no-array-index-key
						key={index}
						file={file}
						onDelete={() => deleteFileById(file.id)}
						onLabelFile={(label) => labelFileById(file.id, label)}
					/>
				))}
			</div>
		);
	};

	const renderMetadataEditor = () => {
		return (
			<>
				<p className="metadata-info">
					Some metadata was found in the imported document that you may wish to apply to
					your Pub. You can always change these values later.
				</p>
				<MetadataEditor
					proposedMetadata={proposedMetadata}
					onSetMetadataUpdater={setMetadataUpdater}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ proposedMetadata: any; onSetMetadataUpdate... Remove this comment to see the full error message
					updatePubData={updatePubData}
				/>
			</>
		);
	};

	const renderFooter = () => {
		return (
			<div className={classNames(Classes.DRAWER_FOOTER, 'dialog-footer')}>
				{renderNerdMode()}
				<Button onClick={onClose}>Cancel</Button>
				{hasProposedMetadata && (
					<Button onClick={handleClearImportResult} icon="chevron-left">
						Add files
					</Button>
				)}
				{(!doc || !importedFilesMatchCurrentFiles) && (
					<Button
						intent="primary"
						icon={doc ? 'refresh' : 'import'}
						onClick={handleStartImportTask}
						disabled={isImportDisabled}
					>
						{doc ? 'Retry import' : 'Import'}
					</Button>
				)}
				{doc && importedFilesMatchCurrentFiles && (
					<Button
						intent="success"
						icon="tick"
						onClick={handleFinishImport}
						disabled={isImporting}
						loading={isFinalizing}
					>
						Complete import
					</Button>
				)}
			</div>
		);
	};

	return (
		<Drawer
			className="file-import-dialog-component"
			title="Import to Pub"
			isOpen={isOpen}
			onClose={onClose}
			onClosed={onClosed}
			canOutsideClickClose={false}
		>
			<MenuConfigProvider config={{ usePortal: false }}>
				<div className={Classes.DRAWER_BODY}>
					<div className={Classes.DIALOG_BODY}>
						{!hasProposedMetadata && renderDropArea()}
						{!isImporting && renderImportMessage()}
						{!hasProposedMetadata && renderFileListing()}
						{hasProposedMetadata && renderMetadataEditor()}
					</div>
				</div>
				{renderFooter()}
			</MenuConfigProvider>
		</Drawer>
	);
};
export default FileImportDialog;
