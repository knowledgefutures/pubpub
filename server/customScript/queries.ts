import { CustomScript } from 'server/models';
import { CustomScriptType, CustomScripts } from 'utils/types';

import { communityCanUseCustomScripts } from './permissions';

export const setCustomScriptForCommunity = async (
	communityId: string,
	type: CustomScriptType,
	content: string,
) => {
	const existingScriptForType = await CustomScript.findOne({ where: { communityId, type } });
	if (existingScriptForType) {
		existingScriptForType.content = content;
		await existingScriptForType.save();
	} else {
		await CustomScript.create({ communityId, type, content });
	}
};

export const getCustomScriptsForCommunity = async (communityId: string): Promise<CustomScripts> => {
	if (!communityCanUseCustomScripts(communityId)) {
		return { js: null, css: null };
	}
	const scripts = await CustomScript.findAll({ where: { communityId } });
	const js = scripts.find((s) => s.type === 'js');
	const css = scripts.find((s) => s.type === 'css');
	return {
		js: js?.content || null,
		css: css?.content || null,
	};
};
