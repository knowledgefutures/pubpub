export default (sequelize, dataTypes) => {
	return sequelize.define('DepositTarget', {
		id: sequelize.idType,
		communityId: { type: dataTypes.UUID },
		doiPrefix: { type: dataTypes.STRING },
		service: {
			type: dataTypes.ENUM,
			values: ['crossref', 'datacite'],
			defaultValue: 'crossref',
		},
		username: { type: dataTypes.STRING },
		password: { type: dataTypes.STRING },
		passwordInitVec: { type: dataTypes.TEXT },
	});
};
