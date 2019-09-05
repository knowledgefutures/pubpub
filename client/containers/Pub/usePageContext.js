import { useContext } from 'react';

import { PageContext } from 'components/PageWrapper/PageWrapper';

export const usePageContext = () => {
	return useContext(PageContext);
};
