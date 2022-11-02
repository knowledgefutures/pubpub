import React from 'react';

import { createFacetsStateStore } from './store';

type Context = ReturnType<typeof createFacetsStateStore>;

export const FacetsContext = React.createContext<null | Context>(null);
