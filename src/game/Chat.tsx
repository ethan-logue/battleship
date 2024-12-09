import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface ChatProps {
    socket: Socket;
    room: string;
}

const Chat = ({ socket, room }: ChatProps) => {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        socket.emit('joinRoom', room);

        socket.on('message', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off('message');
        };
    }, [room, socket]);

    const sendMessage = () => {
        if (input.trim()) {
            socket.emit('sendMessage', { room, message: input });
            setInput('');
        }
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;