import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core';
import React from 'react';
import { isDoi } from 'utils/crossref/parseDoi';
import './updateDoi.scss';

type Props = {
	loading?: boolean;
	editable?: boolean;
	doiPrefix: string;
	doiSuffix: string;
	onUpdate(doiSuffix: string): void;
	onGenerate(): void;
	onDelete(): void;
	onSave(): void;
};

export function UpdateDoi(props: Props) {
	const doi = `${props.doiPrefix}/${props.doiSuffix}`;

	let helperText = '';
	let intent: Intent = Intent.NONE;

	if (props.doiSuffix && !isDoi(doi)) {
		helperText = 'Invalid DOI';
		intent = Intent.DANGER;
	}

	if (props.editable === false) {
		if (!props.doiSuffix) {
			return null;
		}
		return (
			<p>
				DOI:{' '}
				<a
					className="doi-link"
					href={`https://doi.org/${props.doiPrefix}/${props.doiSuffix}`}
				>
					{props.doiPrefix}/{props.doiSuffix}
				</a>
			</p>
		);
	}

	console.log(props.loading);

	return (
		<FormGroup
			label="DOI Suffix"
			intent={intent}
			helperText={helperText}
			className="update-doi"
		>
			<InputGroup
				placeholder="Enter a DOI suffix..."
				value={props.doiSuffix}
				onChange={(event) => props.onUpdate(event.target.value)}
				leftElement={<span className="doi-prefix">{props.doiPrefix}/</span>}
			/>
			<Button
				text="Update Suffix"
				loading={props.loading}
				disabled={!props.doiSuffix}
				onClick={props.onSave}
				intent={Intent.SUCCESS}
			/>
			<Button text="Generate Suffix" onClick={props.onGenerate} />
			<Button
				text="Delete"
				disabled={!props.doiSuffix}
				onClick={props.onDelete}
				intent={Intent.DANGER}
			/>
		</FormGroup>
	);
}
