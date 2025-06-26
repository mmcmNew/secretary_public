import { useContext } from 'react';
import ListsContext from './ListsContext';

const useLists = () => useContext(ListsContext);

export default useLists; 