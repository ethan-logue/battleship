import React, { useState } from 'react';

interface ShipProps {
  length: number;
  name: string;
  cellSize: number;
  onPlaceShip?: (x: number, y: number, isVertical: boolean) => boolean;
}
const Ship = ({ length, name, cellSize }: ShipProps) => {
    const [isVertical, setIsVertical] = useState(false); // Default: horizontal
    const [position, setPosition] = useState({ x: 0, y: 0 });

  
    const toggleRotation = () => setIsVertical(!isVertical);
  
    

    return (
        <svg
            width={isVertical ? cellSize : cellSize * length}
            height={isVertical ? cellSize * length : cellSize}
            x={position.x * cellSize}
            y={position.y * cellSize}
            onDoubleClick={toggleRotation}
            className={`ship ${name}`}
        >
            <rect
                width={isVertical ? cellSize : cellSize * length}
                height={isVertical ? cellSize * length : cellSize}
                fill="gray"
                rx="5"
                ry="5"
            />
        </svg>
    );
};

export default Ship;
