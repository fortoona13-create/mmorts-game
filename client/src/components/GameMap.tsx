import React, { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { Region } from '../../types';

interface GameMapProps {
  regions: Region[];
  onRegionClick: (region: Region) => void;
}

const GameMap: React.FC<GameMapProps> = ({ regions, onRegionClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application({
      width: window.innerWidth - 300,
      height: window.innerHeight - 100,
      backgroundColor: 0x1a1a2e,
      antialias: true,
    });

    containerRef.current.appendChild(app.canvas);
    appRef.current = app;

    // Draw background grid
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x333333, 0.5);
    for (let i = 0; i < app.view.width; i += 50) {
      grid.moveTo(i, 0);
      grid.lineTo(i, app.view.height);
    }
    for (let i = 0; i < app.view.height; i += 50) {
      grid.moveTo(0, i);
      grid.lineTo(app.view.width, i);
    }
    app.stage.addChild(grid);

    // Draw regions
    regions.forEach((region) => {
      const circle = new PIXI.Graphics();
      circle.lineStyle(2, 0x00ff00, 1);
      circle.beginFill(0x00aa00, 0.3);
      circle.drawCircle(region.x, region.y, 30);
      circle.endFill();
      circle.interactive = true;
      circle.cursor = 'pointer';
      circle.on('click', () => onRegionClick(region));

      // Region label
      const text = new PIXI.Text(region.name, {
        fontSize: 12,
        fill: 0xffffff,
      });
      text.x = region.x - text.width / 2;
      text.y = region.y + 40;

      // Happiness indicator (color)
      const happinessColor =
        region.morale_level > 70 ? 0x00ff00 : region.morale_level > 40 ? 0xffff00 : 0xff0000;
      const indicator = new PIXI.Graphics();
      indicator.beginFill(happinessColor);
      indicator.drawCircle(region.x, region.y - 40, 8);
      indicator.endFill();

      app.stage.addChild(circle, text, indicator);
    });

    // Zoom and pan
    let isMouseDown = false;
    let startX = 0;
    let startY = 0;

    app.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoom = e.deltaY > 0 ? 0.9 : 1.1;
      app.stage.scale.x *= zoom;
      app.stage.scale.y *= zoom;
    });

    return () => {
      app.destroy();
    };
  }, [regions, onRegionClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen bg-gray-900 rounded-lg overflow-hidden"
    />
  );
};

export default GameMap;
