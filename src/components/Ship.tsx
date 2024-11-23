import { useState } from 'react';
import Draggable, { DraggableEvent, DraggableData } from 'react-draggable';

interface ShipProps {
  name: string;
  length: number;
  x: number;
  y: number;
  isVertical: boolean;
  cellSize: number;
  onPlaceShip: (name: string, x: number, y: number, isVertical: boolean) => void;
}

const Ship = ({ name, length, x, y, isVertical, cellSize, onPlaceShip }: ShipProps) => {
  const [dragging, setDragging] = useState(false);

  const handleDragStart = () => {
    setDragging(true);
  };

  const handleDragStop = (_e: DraggableEvent, data: DraggableData) => {
    setDragging(false);

    // Calculate grid position
    const snappedX = Math.round(data.x / cellSize);
    const snappedY = Math.round(data.y / cellSize);

    // Notify GameBoard of new position
    onPlaceShip(name, snappedX, snappedY, isVertical);
  };

  const toggleRotation = () => {
    if (!dragging) {
      onPlaceShip(name, x, y, !isVertical);
    }
  };

  return (
    <Draggable
        position={{
            x: x * cellSize,
            y: y * cellSize,
        }}
        grid={[cellSize, cellSize]} // Snap to grid
        onStart={handleDragStart}
        onStop={handleDragStop}
    >
        <rect
            className={`ship ${name}`}
            x={0}
            y={0}
            width={isVertical ? cellSize : cellSize * length}
            height={isVertical ? cellSize * length : cellSize}
            fill="gray"
            rx="5"
            ry="5"
            onDoubleClick={toggleRotation}
            style={{
                cursor: dragging ? 'grabbing' : 'grab',
            }}
        />
    </Draggable>
  );
};

export default Ship;
