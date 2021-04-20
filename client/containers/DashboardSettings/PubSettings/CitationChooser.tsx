import React from 'react';
import { Button, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { InputField } from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { citationStyles, citationInlineStyles } from 'utils/citations';

require('./citationChooser.scss');

type Props = {
	pubData: {
		id?: string;
		citationStyle?: string;
		citationInlineStyle?: string;
	};
	communityId: string;
	onSetCitations: (...args: any[]) => any;
};

const CitationChooser = (props: Props) => {
	const { communityId, pubData, onSetCitations } = props;
	const { citationStyle, citationInlineStyle } = pubData;

	const updateCitations = (updateData) => {
		onSetCitations(updateData);
		return apiFetch('/api/pubs', {
			method: 'PUT',
			body: JSON.stringify({
				...updateData,
				pubId: pubData.id,
				communityId,
			}),
		}).catch((err) => console.error('Error Saving Pub Citation Style: ', err));
	};

	const activeCitationStyle = citationStyles.find((item) => {
		return item.key === citationStyle;
	});
	const activeCitationInlineStyle = citationInlineStyles.find((item) => {
		return item.key === citationInlineStyle;
	});
	return (
		<div className="citation-chooser-component">
			<InputField label="Citation Style">
				<Select
					items={citationStyles}
					itemRenderer={(item, { handleClick }) => (
						<MenuItem
							onClick={handleClick}
							key={item.key}
							// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
							active={item.key === activeCitationStyle.key}
							text={item.name}
						/>
					)}
					filterable={false}
					popoverProps={{ minimal: true }}
					onItemSelect={(item) => {
						updateCitations({ citationStyle: item.key });
					}}
				>
					{/* @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'. */}
					<Button text={activeCitationStyle.name} rightIcon="caret-down" />
				</Select>
			</InputField>

			<InputField label="Inline Citation Style">
				<Select
					items={citationInlineStyles}
					itemRenderer={(item, { handleClick }) => (
						<MenuItem
							onClick={handleClick}
							key={item.key}
							// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
							active={item.key === activeCitationInlineStyle.key}
							text={
								<span>
									{item.title}
									<span className="cite-example">{item.example}</span>
								</span>
							}
						/>
					)}
					filterable={false}
					popoverProps={{ minimal: true }}
					onItemSelect={(item) => {
						updateCitations({ citationInlineStyle: item.key });
					}}
				>
					<Button
						text={
							<span>
								{/* @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'. */}
								{activeCitationInlineStyle.title}
								<span className="cite-example">
									{/* @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'. */}
									{activeCitationInlineStyle.example}
								</span>
							</span>
						}
						rightIcon="caret-down"
					/>
				</Select>
			</InputField>
		</div>
	);
};
export default CitationChooser;
