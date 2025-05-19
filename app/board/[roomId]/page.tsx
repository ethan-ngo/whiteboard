"use client";

import { UserButton } from '@clerk/nextjs';
import React, { useRef, useState, useEffect } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from '@/convex/_generated/dataModel';
import { useParams } from 'next/navigation';

type Mode = 'draw' | 'erase';

export default function DrawingCanvas() {
  const params = useParams();
  const roomId = params.roomId as Id<"rooms">;
  const canvasRef = useRef<CanvasDraw | null>(null);
  const [mode, setMode] = useState<Mode>('draw');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const lastSaveRef = useRef<string>(''); 
  
  const { viewer, canvasData } = useQuery(
    api.myFunctions.getCanvas,
    { roomID: roomId }
  ) ?? {};
  const updateCanvas = useMutation(api.myFunctions.updateCanvas);

  // Load canvas data when available
  useEffect(() => {
    if (!canvasRef.current || !canvasData) return;
    lastSaveRef.current = canvasData;
    canvasRef.current.loadSaveData(canvasData, true);
  }, [canvasData]);

  // Add mouse up listener
  useEffect(() => {
    const handleMouseUp = () => {
      handleDrawingChange();
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []); // Empty dependency array since handleDrawingChange uses refs

  const handleDrawingChange = () => {
    if (!canvasRef.current) return;
    const saveData = canvasRef.current.getSaveData();
    const parsedNewData = JSON.parse(saveData);
    const parsedLastData = lastSaveRef.current ? JSON.parse(lastSaveRef.current) : null;
    
    const hasChanged = !parsedLastData || 
      JSON.stringify(parsedNewData.lines) !== JSON.stringify(parsedLastData.lines);

    if (hasChanged) {
      lastSaveRef.current = saveData;
      void updateCanvas({ roomID: roomId, saveData });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-background p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-row justify-between items-center">
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
        />
        <label>
          Size:
          <input
            type="range"
            min={1}
            max={50}
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            style={{ marginLeft: 4 }}
          />
        </label>
        <button 
          onClick={() => setMode('draw')}
          className={`px-4 py-2 rounded-md ${
            mode === 'draw' 
            ? 'bg-foreground text-background' 
            : 'bg-background text-foreground border border-foreground'
          }`}
        >
          Draw
        </button>
        <button 
          onClick={() => setMode('erase')}
          className={`px-4 py-2 rounded-md ${
            mode === 'erase' 
            ? 'bg-foreground text-background' 
            : 'bg-background text-foreground border border-foreground'
          }`}
        >
          Erase
        </button>
        <button 
          onClick={() => {
            canvasRef.current?.clear();
            handleDrawingChange();
          }}
          className="px-4 py-2 rounded-md bg-background text-foreground border border-foreground"
        >
          Clear
        </button>
        <UserButton />
      </header>
      <main className="w-full h-[calc(100vh-200px)]">
        <CanvasDraw
          ref={canvasRef}
          brushColor={mode === 'erase' ? '#ffffff' : color}
          brushRadius={brushSize}
          lazyRadius={0}
          canvasWidth={800}
          canvasHeight={800}
          hideGrid={true}
          className="border border-slate-200"
        />
      </main>
    </>
  );
}
