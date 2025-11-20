/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { ClockIcon, ArrowRightIcon, DocumentIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface Creation {
  id: string;
  name: string;
  html: string;
  originalImage?: string; // Base64 data URL
  timestamp: Date;
}

interface CreationHistoryProps {
  history: Creation[];
  onSelect: (creation: Creation) => void;
  onDelete: (id: string) => void;
}

export const CreationHistory: React.FC<CreationHistoryProps> = ({ history, onSelect, onDelete }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center space-x-3 mb-3 px-2">
        <ClockIcon className="w-4 h-4 text-zinc-400" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Arquivo Recente</h2>
        <div className="h-px flex-1 bg-zinc-300"></div>
      </div>
      
      {/* Horizontal Scroll Container for Compact Layout */}
      <div className="flex overflow-x-auto space-x-4 pb-2 px-2 scrollbar-hide">
        {history.map((item) => {
          const isPdf = item.originalImage?.startsWith('data:application/pdf');
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className="group flex-shrink-0 relative flex flex-col text-left w-44 h-28 bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 rounded-lg transition-all duration-200 overflow-hidden cursor-pointer shadow-sm hover:shadow"
            >
              {/* Delete Button - High Z-Index and Stop Propagation */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="absolute top-2 right-2 p-2 rounded-md bg-white text-zinc-400 hover:text-red-500 hover:bg-red-50 border border-zinc-200 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 z-50 cursor-pointer shadow-md"
                title="Remover do histórico"
              >
                 <TrashIcon className="w-4 h-4 pointer-events-none" />
              </button>

              <div className="p-4 flex flex-col h-full relative z-10">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1.5 bg-zinc-100 rounded group-hover:bg-zinc-200 transition-colors border border-zinc-200">
                      {isPdf ? (
                          <DocumentIcon className="w-4 h-4 text-zinc-500" />
                      ) : item.originalImage ? (
                          <PhotoIcon className="w-4 h-4 text-zinc-500" />
                      ) : (
                          <DocumentIcon className="w-4 h-4 text-zinc-500" />
                      )}
                  </div>
                  {/* Fades out on hover to reduce visual noise */}
                  <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-500 group-hover:opacity-100 opacity-60 transition-all">
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="mt-auto">
                  <h3 className="text-sm font-medium text-zinc-900 group-hover:text-black truncate pr-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-blue-600">Restaurar</span>
                    <ArrowRightIcon className="w-3 h-3 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};