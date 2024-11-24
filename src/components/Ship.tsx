import { useEffect, useState } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';

export interface ShipProps {
    name: string;
    length: number;
    x: number;
    y: number;
    isVertical: boolean;
    cellSize: number;
    onPlaceShip: (name: string, x: number, y: number, isVertical: boolean) => boolean;
}

const Ship = ({ name, length, x, y, isVertical, cellSize, onPlaceShip }: ShipProps) => {
    const [dragging, setDragging] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ x, y });
    const [isPreviewValid, setIsPreviewValid] = useState(true);
    const [lastValidPosition, setLastValidPosition] = useState({ x, y });

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

    useEffect(() => {
        const handleRotation = (e: KeyboardEvent) => {
            if (!dragging || e.code !== 'KeyR') return;     
            e.preventDefault();
            const newOrientation = !isVertical;
    
            const valid = onPlaceShip(name, x, y, newOrientation);
            if (valid) onPlaceShip(name, x, y, newOrientation);
        };

        if (dragging) {
            window.addEventListener('keydown', handleRotation);
        } else {
            window.removeEventListener('keydown', handleRotation);
        }

        return () => {
            window.removeEventListener('keydown', handleRotation);
        };
    }, [dragging, isVertical, name, onPlaceShip, previewPosition.x, previewPosition.y, x, y]);

    useEffect(() => {
        setPreviewPosition({ x, y });
    }, [x, y]);

    return (
        <g id={`${name}`} className={`ship ${name}`}>
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
