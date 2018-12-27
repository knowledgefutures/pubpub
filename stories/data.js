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

const initialData = require('./dataInitial.js');

export const locationData = initialData.locationData;
export const loginData = initialData.loginData;
// export const communityData = initialData.communityData;
export const communityData = require('./dataCommunity.js');
export const collectionData = require('./dataCollection.js');
export const pubData = require('./dataPub.js');
export const plainDoc = require('./dataDocs.js').plainDoc;
export const imageDoc = require('./dataDocs.js').imageDoc;
export const fullDoc = require('./dataDocs.js').fullDoc;
