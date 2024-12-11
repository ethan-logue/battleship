import { io } from 'socket.io-client';
import { baseUrl } from './apiUtils';
import { getToken } from './tokenUtils';

const socket = io(baseUrl, {
    auth: {
        token: getToken(),
    },
});

export default socket;