export default (relatedItems) => {
	return {
		'rel:program': {
			'@name': 'relations',
			'rel:related_item': relatedItems.map(
				({ isIntraWork, identifier, identifierType, relationshipType }) => {
					const attrs = {
						'@identifier-type': identifierType,
						'@relationship-type': relationshipType,
						'#text': identifier,
					};

					return {
						[isIntraWork
							? 'rel:intra_work_relation'
							: 'rel:inter_work_relation']: attrs,
					};
				},
			),
		},
	};
};
