/**
 * ScreenshotEditor Component
 *
 * 스크린샷 편집기 컴포넌트 (주석 추가)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Screenshot, Annotation, Point, ArrowAnnotation, TextAnnotation, ShapeAnnotation } from '../../types/screenshot';
import { AnnotationManager } from '../../utils/screenshot/annotation/annotationManager';
import { AnnotationHistory } from '../../utils/screenshot/annotation/history';

interface ScreenshotEditorProps {
  screenshot: Screenshot;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

type AnnotationTool = 'select' | 'arrow' | 'text' | 'rectangle' | 'circle' | 'pen';

export const ScreenshotEditor: React.FC<ScreenshotEditorProps> = ({
  screenshot,
  onSave,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [manager, setManager] = useState<AnnotationManager | null>(null);
  const [history, setHistory] = useState<AnnotationHistory | null>(null);
  const [selectedTool, setSelectedTool] = useState<AnnotationTool>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [zoom, setZoom] = useState(1);

  // Create annotation helpers
  const createArrowAnnotation = useCallback((start: Point, end: Point): ArrowAnnotation => ({
    id: crypto.randomUUID(),
    type: 'arrow',
    data: {
      type: 'arrow',
      start,
      end,
      style: { color: '#ef4444', width: 3 },
    },
  }), []);

  const createShapeAnnotation = useCallback((
    start: Point,
    end: Point,
    shape: 'rectangle' | 'circle'
  ): ShapeAnnotation => ({
    id: crypto.randomUUID(),
    type: 'shape',
    data: {
      type: 'shape',
      shape,
      points: [start, end],
      style: { borderColor: '#3b82f6', borderWidth: 3, fillColor: undefined },
    },
  }), []);

  const createPenAnnotation = useCallback((points: Point[]): ShapeAnnotation => ({
    id: crypto.randomUUID(),
    type: 'shape',
    data: {
      type: 'shape',
      shape: 'rectangle', // Using rectangle type for freehand
      points,
      style: { borderColor: '#10b981', borderWidth: 2, fillColor: undefined },
    },
  }), []);

  const createTextAnnotation = useCallback((position: Point, text: string): TextAnnotation => ({
    id: crypto.randomUUID(),
    type: 'text',
    data: {
      type: 'text',
      text,
      position,
      style: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      },
    },
  }), []);

  // Draw preview while dragging
  const drawPreview = useCallback((
    _manager: AnnotationManager,
    start: Point,
    end: Point,
    tool: AnnotationTool
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    switch (tool) {
      case 'arrow':
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case 'rectangle':
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          Math.min(start.x, end.x),
          Math.min(start.y, end.y),
          Math.abs(end.x - start.x),
          Math.abs(end.y - start.y)
        );
        break;
      case 'circle': {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        ) / 2;
        ctx.beginPath();
        ctx.arc(
          (start.x + end.x) / 2,
          (start.y + end.y) / 2,
          radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        break;
      }
      case 'pen':
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(currentPoints[0]?.x || 0, currentPoints[0]?.y || 0);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.stroke();
        break;
    }

    ctx.restore();
  }, [currentPoints]);

  // Initialize canvas and annotation manager
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;

    // Set canvas size first before getting context
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Now get the context after canvas has dimensions
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2d context from canvas');
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Create annotation manager
      const annotationManager = new AnnotationManager(canvas, screenshot.dataUrl);
      setManager(annotationManager);

      // Create history manager
      const annotationHistory = new AnnotationHistory();
      setHistory(annotationHistory);
    };
    img.onerror = () => {
      console.error('Failed to load screenshot image');
    };
    img.src = screenshot.dataUrl;
  }, [screenshot.dataUrl]);

  // Handle canvas click/drag for drawing
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!manager || selectedTool === 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const point: Point = { x, y };

    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoints([point]);
  }, [manager, selectedTool, zoom]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const point: Point = { x, y };

    setCurrentPoints(prev => [...prev, point]);

    // Live preview
    if (manager && startPoint) {
      manager.render();
      drawPreview(manager, startPoint, point, selectedTool);
    }
  }, [isDrawing, manager, startPoint, selectedTool, zoom, drawPreview]);

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing || !manager || !history || !startPoint || currentPoints.length === 0) return;

    const endPoint = currentPoints[currentPoints.length - 1];

    // Create annotation based on tool
    let annotation: Annotation | null = null;

    switch (selectedTool) {
      case 'arrow': {
        annotation = createArrowAnnotation(startPoint, endPoint);
        break;
      }
      case 'rectangle':
      case 'circle': {
        annotation = createShapeAnnotation(startPoint, endPoint, selectedTool);
        break;
      }
      case 'pen': {
        annotation = createPenAnnotation(currentPoints);
        break;
      }
      case 'text': {
        // Text annotation requires input
        const text = prompt('Enter text:');
        if (text) {
          annotation = createTextAnnotation(startPoint, text);
        }
        break;
      }
    }

    if (annotation) {
      manager.addAnnotation(annotation);
      history.add(annotation);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
  }, [isDrawing, manager, history, startPoint, currentPoints, selectedTool, createArrowAnnotation, createShapeAnnotation, createPenAnnotation, createTextAnnotation]);

  // Toolbar actions
  const handleUndo = useCallback(() => {
    if (history) {
      history.undo();
      manager?.render();
    }
  }, [history, manager]);

  const handleRedo = useCallback(() => {
    if (history) {
      history.redo();
      manager?.render();
    }
  }, [history, manager]);

  const handleClear = useCallback(() => {
    if (manager && confirm('Clear all annotations?')) {
      manager.clearAnnotations();
      history?.reset();
    }
  }, [manager, history]);

  const handleSave = useCallback(() => {
    if (manager) {
      const dataUrl = manager.toDataURL(screenshot.format, screenshot.quality);
      onSave(dataUrl);
    }
  }, [manager, screenshot.format, screenshot.quality, onSave]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  const tools: { id: AnnotationTool; label: string; icon: string }[] = [
    {
      id: 'select',
      label: 'Select',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>',
    },
    {
      id: 'arrow',
      label: 'Arrow',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
    },
    {
      id: 'rectangle',
      label: 'Rectangle',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>',
    },
    {
      id: 'circle',
      label: 'Circle',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>',
    },
    {
      id: 'pen',
      label: 'Pen',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
    },
    {
      id: 'text',
      label: 'Text',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    },
  ];

  return (
    <div className="klic-screenshot-editor flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="klic-editor-toolbar flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`
                p-2 rounded transition-colors
                ${
                  selectedTool === tool.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }
              `}
              title={tool.label}
              dangerouslySetInnerHTML={{ __html: tool.icon }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button onClick={handleZoomOut} className="p-2 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <span className="text-gray-400 text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
          <button onClick={handleZoomReset} className="p-2 text-gray-400 hover:text-white text-xs">
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="p-2 text-gray-400 hover:text-white"
            title="Undo (Ctrl+Z)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
          </button>
          <button
            onClick={handleRedo}
            className="p-2 text-gray-400 hover:text-white"
            title="Redo (Ctrl+Y)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
            </svg>
          </button>
          <button
            onClick={handleClear}
            className="p-2 text-gray-400 hover:text-red-400"
            title="Clear all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="klic-editor-canvas-container flex-1 overflow-auto flex items-center justify-center bg-gray-900/50"
        style={{ backgroundImage: 'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }}
      >
        <div
          className="relative shadow-2xl"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className="cursor-crosshair"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="klic-editor-footer flex items-center justify-between px-4 py-3 bg-gray-800 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Screenshot: {screenshot.dimensions.width}×{screenshot.dimensions.height} • {screenshot.format.toUpperCase()}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotEditor;
