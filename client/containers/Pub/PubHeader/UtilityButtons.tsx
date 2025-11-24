import type { Callback, PubPageData } from 'types';

import React from 'react';

import { DialogLauncher, FacetEditor, PopoverButton, PubShareDialog } from 'components';
import { getDashUrl } from 'utils/dashboard';
import { usePageContext } from 'utils/hooks';

import CitationsPreview from './CitationsPreview';
import DownloadButton from './DownloadButton';
import PubToc from './PubToc';
import SmallHeaderButton from './SmallHeaderButton';
import Social from './Social';

type Props = {
	onShowHeaderDetails: Callback;
	pubData: PubPageData;
};

const UtilityButtons = (props: Props) => {
	const { onShowHeaderDetails, pubData } = props;
	const { scopeData } = usePageContext();
	const { isRelease, membersData } = pubData;
	const { canManage } = scopeData.activePermissions;

	return (
		<div className="utility-buttons-component">
			<SmallHeaderButton
				className="show-header-details-button"
				icon="info-sign"
				onClick={onShowHeaderDetails}
			/>
			{canManage && !isRelease && (
				<PopoverButton
					component={() => <FacetEditor facetName="PubHeaderTheme" selfContained />}
					className="pub-header-popover"
					aria-label="Pub header theme options"
				>
					<SmallHeaderButton label="Edit theme" labelPosition="left" icon="clean" />
				</PopoverButton>
			)}
			{canManage && (
				<SmallHeaderButton
					label="Pub settings"
					labelPosition="left"
					icon="cog"
					tagName="a"
					href={getDashUrl({ pubSlug: pubData.slug, mode: 'settings' })}
				/>
			)}
			{membersData && (
				<DialogLauncher
					renderLauncherElement={({ openDialog }) => (
						<SmallHeaderButton
							label="Sharing"
							labelPosition="left"
							icon="people"
							className="members-button"
							onClick={openDialog}
						/>
					)}
				>
					{({ isOpen, onClose }) => (
						<PubShareDialog isOpen={isOpen} onClose={onClose} pubData={pubData} />
					)}
				</DialogLauncher>
			)}
			<PopoverButton
				component={() => <CitationsPreview pubData={pubData} />}
				className="pub-header-popover"
				aria-label="Cite this Pub"
			>
				<SmallHeaderButton
					label="Cite"
					className="cite-button"
					labelPosition="left"
					icon="cite"
				/>
			</PopoverButton>
			{isRelease && (
				<Social pubData={pubData}>
					<SmallHeaderButton label="Social" labelPosition="left" icon="share2" />
				</Social>
			)}
			<DownloadButton pubData={pubData} />
			<PubToc>
				<SmallHeaderButton label="Contents" labelPosition="left" icon="toc" />
			</PubToc>
		</div>
	);
};
export default UtilityButtons;
