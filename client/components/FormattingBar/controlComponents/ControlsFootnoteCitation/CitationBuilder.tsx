import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { MenuItem, Spinner, AnchorButton } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';

import { apiFetch } from 'client/utils/apiFetch';
import { CitationStyleKind } from 'utils/citations';
import { ZoteroCSLJSON } from 'types';

require('./citationBuilder.scss');

type Props = {
	citationStyle: CitationStyleKind;
	onSelectCitation: (...args: any[]) => any;
};

type CitationResults = ZoteroCSLJSON[];

const fetchCitations = (query: string, style: string) =>
	apiFetch(`/api/citations/zotero?q=${query}&include=bibtex&style=${style}`);

const renderMenuItem = (item: ZoteroCSLJSON, { handleClick, modifiers }) => (
	<MenuItem
		key={item.key}
		id={item.key}
		text={`${item.meta.creatorSummary} (${item.meta.parsedDate})`}
		onClick={handleClick}
		active={modifiers.active}
	/>
);

const CitationBuilder = (props: Props) => {
	const [zoteroQuery, setZoteroQuery] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [debouncedZoteroQuery] = useDebounce(zoteroQuery.trim(), 300);
	const [zoteroCitations, setZoteroCitations] = useState<Record<string, CitationResults>>({});
	const [hasZoteroIntegration, setHasZoteroIntegration] = useState(false);

	useEffect(() => {
		apiFetch('/api/zoteroIntegration').then((res) => {
			setHasZoteroIntegration(res.id);
		});
	}, []);

	useEffect(
		() => {
			if (hasZoteroIntegration) {
				if (debouncedZoteroQuery && !zoteroCitations[debouncedZoteroQuery]) {
					setIsLoading(true);
					fetchCitations(debouncedZoteroQuery, props.citationStyle).then(({ items }) => {
						setIsLoading(false);
						setZoteroCitations((prev) => ({ ...prev, [debouncedZoteroQuery]: items }));
					});
				} else {
					setIsLoading(false);
				}
			}
		},
		[debouncedZoteroQuery, hasZoteroIntegration, props.citationStyle, zoteroCitations], // Only call effect if debounced search term changes
	);
	return (
		<div className="citation-builder-component">
			<Suggest
				disabled={!hasZoteroIntegration}
				query={zoteroQuery}
				onQueryChange={setZoteroQuery}
				items={zoteroCitations[debouncedZoteroQuery] || []}
				inputProps={{
					placeholder: hasZoteroIntegration
						? 'Search your zotero library...'
						: 'No zotero integration',
					large: true,
				}}
				itemRenderer={renderMenuItem}
				onItemSelect={props.onSelectCitation}
				closeOnSelect={false}
				resetOnSelect={false}
				className="suggest-component"
				inputValueRenderer={() => ''}
				popoverProps={{
					minimal: true,
					popoverClassName: 'citation-select',
					usePortal: false,
					modifiers: {
						minWidth: {
							enabled: true,
							fn: (data) => {
								data.styles.width = `${data.offsets.reference.width}px`;
								return data;
							},
							order: 800,
						},
					},
				}}
				fill={hasZoteroIntegration}
				noResults={
					zoteroQuery ? (
						<MenuItem
							disabled
							className="loading-menu-item"
							text={isLoading ? 'Loading...' : 'No results'}
							icon={isLoading && <Spinner size={16} />}
						/>
					) : null
				}
			/>
			{!hasZoteroIntegration ? (
				<AnchorButton
					rightIcon="exchange"
					intent="primary"
					className="zotero-link-button"
					href="/legal/settings"
					text="Connect Zotero"
				/>
			) : null}
		</div>
	);
};

export default CitationBuilder;
