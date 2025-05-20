"use client";

import { UserButton } from '@clerk/nextjs';
import React, { useRef, useState, useEffect } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from '@/convex/_generated/dataModel';
import { useParams, useRouter } from 'next/navigation';

type Mode = 'draw' | 'erase';

export default function DrawingCanvas() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as Id<"rooms">;
  const canvasRef = useRef<CanvasDraw | null>(null);
  const [mode, setMode] = useState<Mode>('draw');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const lastSaveRef = useRef<string>(''); 
  const [mounted, setMounted] = useState(false);
  const [canvasSize, setCanvasSize] = useState({
    width: 0,
    height: 0
  });
  const [showRoomId, setShowRoomId] = useState(false);

  // Initialize canvas size after mount
  useEffect(() => {
    setMounted(true);
    setCanvasSize({
      width: window.innerWidth,
      height: window.innerHeight- 76
    });

    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight - 76
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { canvasData } = useQuery(
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

  if (!mounted) return null;

  return (
    <>
      <header className="sticky top-0 z-10 bg-white p-4 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left group - Navigation */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Rooms</span>
            </button>
          </div>

          {/* Center group - Drawing tools */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Size:</label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={brushSize}
                  onChange={e => setBrushSize(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setMode('draw')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  mode === 'draw' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Draw
              </button>
              <button 
                onClick={() => setMode('erase')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  mode === 'erase' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Erase
              </button>
              <button 
              onClick={() => {
                canvasRef.current?.clear();
                handleDrawingChange();
              }}
              className="px-4 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            </div>
          </div>

          {/* Right group - Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowRoomId(!showRoomId)}
                className="px-4 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {showRoomId ? 'Hide Code' : 'Show Code'}
              </button>
              {showRoomId && (
                <div className="absolute right-0 top-full mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <p className="text-sm font-medium text-gray-700">Room ID:</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded mt-1">{roomId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="w-full h-[calc(100vh-200px)]">
        {canvasSize.width > 0 && canvasSize.height > 0 && (
          <CanvasDraw
            ref={canvasRef}
            brushColor={mode === 'erase' ? '#ffffff' : color}
            brushRadius={brushSize}
            lazyRadius={0}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            hideGrid={true}
            className="border border-slate-200"
          />
        )}
      </main>
    </>
  );
}
