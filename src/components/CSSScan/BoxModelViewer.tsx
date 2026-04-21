/**
 * Box Model Viewer Component
 *
 * 박스 모델 뷰어 컴포넌트
 */

import React from 'react';
import type { BoxModel } from '../../types/cssScan';
import { BOX_MODEL_COLORS } from '../../constants/cssScanDefaults';

interface BoxModelViewerProps {
  boxModel: BoxModel;
}

export const BoxModelViewer: React.FC<BoxModelViewerProps> = ({ boxModel }) => {
  const totalWidth =
    boxModel.margin.left +
    boxModel.border.left +
    boxModel.padding.left +
    boxModel.content.width +
    boxModel.padding.right +
    boxModel.border.right +
    boxModel.margin.right;

  const totalHeight =
    boxModel.margin.top +
    boxModel.border.top +
    boxModel.padding.top +
    boxModel.content.height +
    boxModel.padding.bottom +
    boxModel.border.bottom +
    boxModel.margin.bottom;

  return (
    <div className="klic-box-model-viewer">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Box Model</h3>

      {/* 시각적 표현 */}
      <div className="relative mb-3">
        <svg
          width={Math.min(300, totalWidth + 40)}
          height={Math.max(120, totalHeight + 40)}
          className="mx-auto border border-gray-200 rounded"
        >
          {/* Margin */}
          <rect
            x={20}
            y={20}
            width={Math.min(260, totalWidth)}
            height={Math.max(80, totalHeight)}
            fill={BOX_MODEL_COLORS.margin}
            fillOpacity={0.2}
            stroke={BOX_MODEL_COLORS.margin}
            strokeWidth={1}
          />

          {/* Border */}
          <rect
            x={20 + boxModel.margin.left}
            y={20 + boxModel.margin.top}
            width={Math.max(0, totalWidth - boxModel.margin.left - boxModel.margin.right)}
            height={Math.max(0, totalHeight - boxModel.margin.top - boxModel.margin.bottom)}
            fill={BOX_MODEL_COLORS.border}
            fillOpacity={0.3}
            stroke={BOX_MODEL_COLORS.border}
            strokeWidth={1}
          />

          {/* Padding */}
          <rect
            x={
              20 +
              boxModel.margin.left +
              boxModel.border.left
            }
            y={
              20 +
              boxModel.margin.top +
              boxModel.border.top
            }
            width={Math.max(
              0,
              totalWidth -
                boxModel.margin.left -
                boxModel.margin.right -
                boxModel.border.left -
                boxModel.border.right
            )}
            height={Math.max(
              0,
              totalHeight -
                boxModel.margin.top -
                boxModel.margin.bottom -
                boxModel.border.top -
                boxModel.border.bottom
            )}
            fill={BOX_MODEL_COLORS.padding}
            fillOpacity={0.3}
            stroke={BOX_MODEL_COLORS.padding}
            strokeWidth={1}
          />

          {/* Content */}
          <rect
            x={
              20 +
              boxModel.margin.left +
              boxModel.border.left +
              boxModel.padding.left
            }
            y={
              20 +
              boxModel.margin.top +
              boxModel.border.top +
              boxModel.padding.top
            }
            width={boxModel.content.width}
            height={boxModel.content.height}
            fill={BOX_MODEL_COLORS.content}
            fillOpacity={0.4}
            stroke={BOX_MODEL_COLORS.content}
            strokeWidth={1}
          />
        </svg>
      </div>

      {/* 수치 정보 */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Content */}
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: BOX_MODEL_COLORS.content }}
          />
          <span className="text-gray-500">Content:</span>
          <span className="font-mono">
            {Math.round(boxModel.content.width)} × {Math.round(boxModel.content.height)}
          </span>
        </div>

        {/* Padding */}
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: BOX_MODEL_COLORS.padding }}
          />
          <span className="text-gray-500">Padding:</span>
          <span className="font-mono text-[10px]">
            {boxModel.padding.top} {boxModel.padding.right} {boxModel.padding.bottom}{' '}
            {boxModel.padding.left}
          </span>
        </div>

        {/* Border */}
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: BOX_MODEL_COLORS.border }}
          />
          <span className="text-gray-500">Border:</span>
          <span className="font-mono text-[10px]">
            {boxModel.border.top} {boxModel.border.right} {boxModel.border.bottom}{' '}
            {boxModel.border.left}
          </span>
        </div>

        {/* Margin */}
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: BOX_MODEL_COLORS.margin }}
          />
          <span className="text-gray-500">Margin:</span>
          <span className="font-mono text-[10px]">
            {boxModel.margin.top} {boxModel.margin.right} {boxModel.margin.bottom}{' '}
            {boxModel.margin.left}
          </span>
        </div>
      </div>

      {/* 전체 크기 */}
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
        <span className="text-gray-500">Total:</span>{' '}
        <span className="font-mono">
          {Math.round(totalWidth)} × {Math.round(totalHeight)}
        </span>
      </div>
    </div>
  );
};

export default BoxModelViewer;
