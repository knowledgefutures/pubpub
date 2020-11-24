import React from 'react';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { DialogLauncher, PubThemePicker, PubShareDialog, PopoverButton } from 'components';

import CitationsPreview from './CitationsPreview';
import Download from './Download';
import PubToc from './PubToc';
import SmallHeaderButton from './SmallHeaderButton';
import Social from './Social';

type Props = {
	onShowHeaderDetails: (...args: any[]) => any;
	pubData: {
		membersData?: {};
		slug?: string;
		isRelease?: boolean;
	};
	pubHeadings: {}[];
	updatePubData: (...args: any[]) => any;
};

const UtilityButtons = (props: Props) => {
	const { onShowHeaderDetails, pubData, pubHeadings, updatePubData } = props;
	const { membersData, isRelease } = pubData;
	const { communityData, scopeData } = usePageContext();
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
					component={PubThemePicker}
					className="pub-header-popover"
					updatePubData={updatePubData}
					pubData={pubData}
					communityData={communityData}
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
				component={CitationsPreview}
				className="pub-header-popover"
				pubData={pubData}
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
			<Download pubData={pubData}>
				<SmallHeaderButton label="Download" labelPosition="left" icon="download2" />
			</Download>
			{pubHeadings.length > 0 && (
				// @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message
				<PubToc headings={pubHeadings}>
					<SmallHeaderButton label="Contents" labelPosition="left" icon="toc" />
				</PubToc>
			)}
		</div>
	);
};
export default UtilityButtons;
