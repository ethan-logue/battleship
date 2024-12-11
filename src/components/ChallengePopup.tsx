import React from 'react';
import { Player } from '../utils/PlayerContext';

type ChallengePopupProps = {
    challenger: Player;
    onAccept: () => void;
    onReject: () => void;
};

const ChallengePopup: React.FC<ChallengePopupProps> = ({ challenger, onAccept, onReject }) => {
    return (
        <div className='challenge-popup'>
            <p className='challenge-msg'><span>{challenger.username}</span> has challenged you! Do you accept?</p>
            <div className='challenge-btns'>
                <button onClick={onAccept}>Yes</button>
                <button onClick={onReject}>No</button>
            </div>
        </div>
    );
};

export default ChallengePopup;
