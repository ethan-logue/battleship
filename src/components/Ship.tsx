import { useCallback, useEffect, useRef, useState } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';

export interface ShipProps {
    name: string;
    length: number;
    x: number;
    y: number;
    isVertical: boolean;
    cellSize: number;
    onPlaceShip: (name: string, x: number, y: number, isVertical: boolean) => boolean;
    hits: Set<string>;
    isSunk: boolean;
    playerReady?: boolean;
}

const Ship = ({ name, length, x, y, isVertical, cellSize, onPlaceShip, isSunk, playerReady }: ShipProps) => {
    const [dragging, setDragging] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ x, y });
    const [isPreviewValid, setIsPreviewValid] = useState(true);

    const nodeRef = useRef(null); // For Draggable, dismisses warning about findDOMNode being deprecated

    const handleDragStart = () => {
        setDragging(true);
        setPreviewPosition({ x, y });
    };

    const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
        const snappedX = Math.round(data.x / cellSize);
        const snappedY = Math.round(data.y / cellSize);
        
        setPreviewPosition({ x: snappedX, y: snappedY });
        const isValid = onPlaceShip(name, snappedX, snappedY, isVertical);
        setIsPreviewValid(isValid);
    };

    const handleDragStop = () => {
        if (isPreviewValid) {
            onPlaceShip(name, previewPosition.x, previewPosition.y, isVertical);
        } else {
            onPlaceShip(name, x, y, isVertical); // Revert to original position
        }
        setDragging(false);
    };

    // Shake the ship if placement is invalid
    const shakeShip = useCallback(() => {
        const currShip = document.getElementById(name);
            
        if (currShip) {
            currShip.classList.add('shake');
            const currValidity = isPreviewValid; // Save current validity
            
            setIsPreviewValid(false);
            setTimeout(() => {
                currShip.classList.remove('shake');
                setIsPreviewValid(currValidity);
            }, 200);
        }
    }, [name, isPreviewValid]);

    // Rotate ship on key press
    const handleRotation = useCallback((e: KeyboardEvent) => {
        if (!dragging || e.code !== 'KeyR') return;     
        e.preventDefault();
        const newOrientation = !isVertical;

        const isValid = onPlaceShip(name, previewPosition.x, previewPosition.y, newOrientation);
        if (isValid) {
            onPlaceShip(name, previewPosition.x, previewPosition.y, newOrientation);
        } else {
            // Turn ship red and shake
            shakeShip();
        }
    }, [dragging, isVertical, onPlaceShip, name, previewPosition, shakeShip]);
   
    // Add event listener for rotation
    useEffect(() => {
        if (dragging) {
            window.addEventListener('keydown', handleRotation);
        } else {
            window.removeEventListener('keydown', handleRotation);
        }

        return () => {
            window.removeEventListener('keydown', handleRotation);
        };
    }, [dragging, handleRotation]);

    // Update preview position
    useEffect(() => {
        setPreviewPosition({ x, y });
    }, [x, y]);

    return (
        <g id={`${name}`} className={`ship ${name} ${isSunk ? 'sunk' : ''}`}>
            <rect
                className='ship-preview'
                x={previewPosition.x * cellSize}
                y={previewPosition.y * cellSize}
                width={isVertical ? cellSize : cellSize * length}
                height={isVertical ? cellSize * length : cellSize}
                fill={isPreviewValid ? 'green' : 'red'}
                opacity={0.6}
                display={dragging ? 'block' : 'none'}
                rx="5"
                ry="5"
                pointerEvents="none"
            />
            <Draggable
                nodeRef={nodeRef}
                position={{
                    x: x * cellSize,
                    y: y * cellSize,
                }}
                grid={[cellSize, cellSize]} // Snap to grid
                onDrag={handleDrag}
                onStop={handleDragStop}
                onStart={handleDragStart}
                disabled={playerReady}
            >
                <rect
                    ref={nodeRef}
                    className='ship-draggable'
                    width={isVertical ? cellSize : cellSize * length}
                    height={isVertical ? cellSize * length : cellSize}
                    fill={dragging ? 'none' : 'var(--ship)'}
                    rx="5"
                    ry="5"
                    style={{
                        cursor: !playerReady ? dragging ? 'grabbing' : 'grab' : 'default',
                    }}
                />
            </Draggable>
        </g>
    );
};

export default Ship;
