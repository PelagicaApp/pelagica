import { createContext, useContext } from 'react';

export const RowIdentityContext = createContext('');

export const useRowIdentity = () => useContext(RowIdentityContext);
