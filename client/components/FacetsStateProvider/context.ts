import type { createFacetsStateStore } from './store';

import React from 'react';

type Context = ReturnType<typeof createFacetsStateStore>;

export const FacetsContext = React.createContext<null | Context>(null);
