import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { usePlayer } from '../utils/PlayerContext';
import './Components.css';

interface ChatProps {
    socket: Socket;
    room: string;
}

interface Message {
    username: string;
    message: string;
}

const Chat = ({ socket, room }: ChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [msg, setMsg] = useState('');
    const { player } = usePlayer();

    useEffect(() => {
        socket.emit('joinRoom', room);

        socket.on('messageResponse', (message: Message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off('messageResponse');
        };
    }, [room, socket]);

    const sendMessage = () => {
        if (msg.trim() && player) {
            socket.emit('sendMessage', { 
                room,
                message: msg,
                username: player.username 
            });
            setMsg('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.length === 0 ? (
                    <div className='no-msg'>No messages yet</div>
                ) : messages.map((msg, index) => (
                    <div key={index}>
                        <span className='msg-sender'>{msg.username}:</span> {msg.message}
                    </div>
                ))}
                
            </div>
            <div className='send-msg'>
                <input
                    type="text"
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chat;