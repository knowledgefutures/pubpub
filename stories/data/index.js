export const accentDataDark = {
	accentColor: '#D13232',
	accentTextColor: '#FFF',
	accentActionColor: '#A72828',
	accentHoverColor: '#BC2D2D',
	accentMinimalColor: 'rgba(209, 50, 50, 0.15)',
};

export const accentDataLight = {
	accentColor: '#26E0D0',
	accentTextColor: '#000',
	accentActionColor: '#51E6D9',
	accentHoverColor: '#3BE3D4',
	accentMinimalColor: 'rgba(38, 224, 208, 0.15)',
};

import initialData from './dataInitial.js';
export const { locationData, loginData } = initialData;

export { default as communityData } from './dataCommunity.js';
export { default as collectionData } from './dataCollection.js';
export { default as pubData } from './dataPub.js';
export { plainDoc, imageDoc, fullDoc } from './dataDocs.js';
