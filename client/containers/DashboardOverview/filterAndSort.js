import { useState } from 'react';

export const useFilterAndSort = () => {
	const [filterText, setFilterText] = useState('');
	return { filterText: filterText, setFilterText: setFilterText };
};
