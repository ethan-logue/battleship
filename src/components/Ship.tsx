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
}

const Ship = ({ name, length, x, y, isVertical, cellSize, onPlaceShip, isSunk }: ShipProps) => {
    const [dragging, setDragging] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ x, y });
    const [isPreviewValid, setIsPreviewValid] = useState(true);
    const [lastValidPosition, setLastValidPosition] = useState({ x, y });

    const nodeRef = useRef(null); // For Draggable, dismisses warning about findDOMNode being deprecated

    const handleDragStart = () => {
        setLastValidPosition({ x: x, y: y });
        setDragging(true);
    };

    const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
        const snappedX = Math.round(data.x / cellSize);
        const snappedY = Math.round(data.y / cellSize);
        setPreviewPosition({ x: snappedX, y: snappedY });

        const valid = onPlaceShip(name, snappedX, snappedY, isVertical);
        setIsPreviewValid(valid);
    };

    const handleDragStop = () => {
        if (isPreviewValid) {
            onPlaceShip(name, previewPosition.x, previewPosition.y, isVertical);
        } else {
            onPlaceShip(name, lastValidPosition.x, lastValidPosition.y, isVertical); // Revert to original position
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

        const valid = onPlaceShip(name, previewPosition.x, previewPosition.y, newOrientation);
        if (valid) {
            onPlaceShip(name, previewPosition.x, previewPosition.y, newOrientation);
        } else {
            // Turn ship red and shake
            shakeShip();
        }
    }, [dragging, isVertical, onPlaceShip, name, previewPosition.x, previewPosition.y, shakeShip]);
   
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
            >
                <rect
                    ref={nodeRef}
                    className='ship-draggable'
                    width={isVertical ? cellSize : cellSize * length}
                    height={isVertical ? cellSize * length : cellSize}
                    fill={dragging ? 'none' : 'gray'}
                    rx="5"
                    ry="5"
                    style={{
                        cursor: dragging ? 'grabbing' : 'grab',
                    }}
                />
            </Draggable>
        </g>
    );
};

export default Ship;
