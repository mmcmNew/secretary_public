import { useContext } from 'react';
import { UpdateWebSocketContext } from './UpdateWebSocketContext';

export default function useUpdateWebSocket() {
  return useContext(UpdateWebSocketContext);
}
