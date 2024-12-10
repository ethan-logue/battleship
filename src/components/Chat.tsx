import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface ChatProps {
    socket: Socket;
    room: string;
}

interface Message {
    playerId: string;
    message: string;
}

const Chat = ({ socket, room }: ChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        socket.emit('joinRoom', room);

        socket.on('message', (message: Message) => {
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
                    <div key={index}>
                        <strong>{msg.playerId}:</strong> {msg.message}
                    </div>
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