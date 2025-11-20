
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useState, useEffect } from 'react';
import { ArrowUpTrayIcon, CpuChipIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { CloudArrowUpIcon } from '@heroicons/react/24/solid';

interface InputAreaProps {
  onGenerate: (prompt: string, file?: File) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const CyclingText = () => {
    const words = [
        "um resumo do livro",
        "um quadro branco caótico",
        "um nível de jogo",
        "uma revisão da prova",
        "um diagrama complexo",
        "um trabalho de escola"
    ];
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false); // fade out
            setTimeout(() => {
                setIndex(prev => (prev + 1) % words.length);
                setFade(true); // fade in
            }, 500); // Wait for fade out
        }, 3000); // Slower cycle to read longer text
        return () => clearInterval(interval);
    }, [words.length]);

    return (
        <span className={`inline-block whitespace-nowrap transition-all duration-500 transform ${fade ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-sm'} text-blue-600 font-bold pb-1 border-b-2 border-blue-200`}>
            {words[index]}
        </span>
    );
};

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      onGenerate("", file);
    } else {
      alert("Por favor, faça upload de uma imagem ou PDF.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, isGenerating]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isGenerating) {
        setIsDragging(true);
    }
  }, [disabled, isGenerating]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto perspective-1000 relative z-20">
      {/* Glow Effect Behind */}
      <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-25 transition duration-1000 group-hover:opacity-100 ${isDragging ? 'opacity-75 duration-200' : ''}`}></div>
      
      <div 
        className={`relative group transition-all duration-300 ${isDragging ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <label
          className={`
            relative flex flex-col items-center justify-center
            h-64 sm:h-72 md:h-[24rem]
            bg-white
            rounded-2xl shadow-2xl
            cursor-pointer overflow-hidden
            border-4 border-transparent
            transition-all duration-300
            ${isGenerating ? 'pointer-events-none opacity-90' : ''}
          `}
        >
            {/* Inner Dashed Border Container */}
            <div className={`
                absolute inset-3 md:inset-4 
                border-2 border-dashed rounded-xl 
                flex flex-col items-center justify-center
                transition-all duration-300
                ${isDragging 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : 'border-zinc-200 group-hover:border-blue-300 group-hover:bg-zinc-50/30'
                }
            `}>
                
                {/* Animated Background Grid inside the card */}
                <div className="absolute inset-0 opacity-[0.4] pointer-events-none" 
                     style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                </div>

                {/* Main Content */}
                <div className="relative z-10 flex flex-col items-center text-center space-y-6 p-6 w-full">
                    
                    {/* Icon Circle */}
                    <div className={`
                        relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center 
                        transition-all duration-500 shadow-lg
                        ${isDragging ? 'bg-blue-100 scale-110' : 'bg-white group-hover:-translate-y-2'}
                    `}>
                         {/* Pulse Ring */}
                        <div className={`absolute inset-0 rounded-full border border-blue-100 ${!isGenerating && !isDragging ? 'animate-ping opacity-20' : ''}`}></div>
                        
                        {isGenerating ? (
                            <CpuChipIcon className="w-10 h-10 md:w-12 md:h-12 text-purple-600 animate-spin-slow" />
                        ) : (
                            <CloudArrowUpIcon className={`w-10 h-10 md:w-12 md:h-12 transition-colors duration-300 ${isDragging ? 'text-blue-600' : 'text-blue-500 group-hover:text-purple-500'}`} />
                        )}
                    </div>

                    <div className="space-y-3 w-full max-w-xl">
                        <h3 className="text-2xl sm:text-3xl md:text-4xl text-zinc-900 font-bold tracking-tight">
                            <span className="block text-zinc-400 text-lg md:text-xl font-medium mb-1">Dê vida a</span>
                            {/* Fixed height container */}
                            <div className="h-8 sm:h-10 md:h-12 flex items-center justify-center w-full">
                               <CyclingText />
                            </div>
                        </h3>
                        
                        <p className="text-zinc-500 text-sm sm:text-base font-medium px-4">
                            Arraste arquivos ou clique para fazer upload
                        </p>

                        {/* File Type Badges */}
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-600 border border-zinc-200">
                                <DocumentIcon className="w-3.5 h-3.5" /> PDF
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-600 border border-zinc-200">
                                <PhotoIcon className="w-3.5 h-3.5" /> PNG
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-600 border border-zinc-200">
                                <PhotoIcon className="w-3.5 h-3.5" /> JPG
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={isGenerating || disabled}
            />
        </label>
      </div>
    </div>
  );
};
