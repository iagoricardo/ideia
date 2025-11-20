
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { ArrowDownTrayIcon, PlusIcon, ViewColumnsIcon, DocumentIcon, CodeBracketIcon, XMarkIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';
import { SplineScene } from './SplineScene';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
}

// Add type definition for the global pdfjsLib
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        if (isMounted) {
            setError("Biblioteca PDF não inicializada");
            setLoading(false);
        }
        return;
      }

      // Ensure previous render task is cancelled before starting a new one
      // to prevent "Cannot use the same canvas" errors.
      if (renderTaskRef.current) {
          try {
              await renderTaskRef.current.cancel();
          } catch (e) {
              // Cancellation promise might reject, which is expected.
          }
      }

      try {
        if (isMounted) {
            setLoading(true);
            setError(null);
        }

        // Load the document
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;

        // Get the first page
        const page = await pdf.getPage(1);
        
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        
        // Calculate scale to make it look good (High DPI)
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        
        if (isMounted) {
             setLoading(false);
             if (renderTaskRef.current === renderTask) {
                 renderTaskRef.current = null;
             }
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') {
            return;
        }
        console.error("Error rendering PDF:", err);
        if (isMounted) {
            setError("Não foi possível renderizar a pré-visualização do PDF.");
            setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
        isMounted = false;
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }
    };
  }, [dataUrl]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
            <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-400" />
            <p className="text-sm mb-2 text-red-400/80">{error}</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-200 rounded transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, isFocused, onReset }) => {
    const [showSplitView, setShowSplitView] = useState(false);
    const [loadingText, setLoadingText] = useState("CONSTRUINDO AMBIENTE");

    // Handle loading animation text cycling
    useEffect(() => {
        if (isLoading) {
            const messages = [
                "LENDO ARTEFATO...",
                "INTERPRETANDO VISUAIS...",
                "GERANDO CÓDIGO...",
                "APLICANDO ESTILOS...",
                "CRIANDO INTERATIVIDADE...",
                "CONSTRUINDO AMBIENTE..."
            ];
            let i = 0;
            // Cycle text to show activity
            const interval = setInterval(() => {
                setLoadingText(messages[i]);
                i = (i + 1) % messages.length;
            }, 2000);
            return () => clearInterval(interval);
        } else {
            setLoadingText("CONSTRUINDO AMBIENTE");
        }
    }, [isLoading]);

    // Default to Full App View (showSplitView = false) when a new creation is loaded
    useEffect(() => {
        setShowSplitView(false);
    }, [creation]);

    const handleExport = () => {
        if (!creation) return;
        const dataStr = JSON.stringify(creation, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_artifact.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

  return (
    <div
      className={`
        fixed z-40 flex flex-col
        rounded-lg overflow-hidden border border-zinc-200 bg-white shadow-2xl
        transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
        ${isFocused
          ? 'inset-2 md:inset-4 opacity-100 scale-100'
          : 'top-1/2 left-1/2 w-[90%] h-[60%] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Minimal Technical Header */}
      <div className="bg-zinc-50 px-4 py-3 flex items-center justify-between border-b border-zinc-200 shrink-0 relative z-50">
        {/* Left: Controls */}
        <div className="flex items-center justify-start w-32">
            <button 
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white hover:bg-red-50 text-zinc-500 hover:text-red-600 border border-zinc-200 hover:border-red-200 transition-all shadow-sm hover:shadow-md group"
              title="Fechar e voltar ao início"
            >
              <XMarkIcon className="w-4 h-4 stroke-2" />
              <span className="text-xs font-bold uppercase tracking-wider">Fechar</span>
            </button>
        </div>
        
        {/* Center: Title */}
        <div className="flex items-center space-x-2 text-zinc-500">
            <CodeBracketIcon className="w-3 h-3" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
                {isLoading ? 'PROCESSANDO SISTEMA...' : creation ? creation.name : 'Modo Visualização'}
            </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-1 w-32">
            {!isLoading && creation && (
                <>
                    {creation.originalImage && (
                         <button 
                            onClick={() => setShowSplitView(!showSplitView)}
                            title={showSplitView ? "Ver Apenas App" : "Comparar com Original"}
                            className={`p-1.5 rounded-md transition-all ${showSplitView ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'}`}
                        >
                            <ViewColumnsIcon className="w-4 h-4" />
                        </button>
                    )}

                    <button 
                        onClick={handleExport}
                        title="Exportar Artefato (JSON)"
                        className="text-zinc-500 hover:text-zinc-700 transition-colors p-1.5 rounded-md hover:bg-zinc-100"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={onReset}
                        title="Novo Upload"
                        className="ml-2 flex items-center space-x-1 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Novo</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full flex-1 bg-zinc-50 flex overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 w-full h-full bg-slate-50 flex items-center justify-center overflow-hidden relative">
             
             {/* Animated Modern Background */}
             <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
             <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px] animate-pulse"></div>
             <div className="absolute right-0 bottom-0 -z-10 h-[400px] w-[400px] rounded-full bg-purple-400 opacity-10 blur-[120px] animate-pulse delay-700"></div>
             
             {/* Spline 3D Robot Scene */}
             <div className="relative z-10 w-full h-full">
                <SplineScene 
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" 
                    className="w-full h-full scale-110 md:scale-100"
                />
             </div>
             
             {/* Animated Loading Status Overlay */}
             <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-6">
                <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl shadow-blue-500/10 p-1 overflow-hidden group">
                   
                   {/* Scanning Progress Bar */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 animate-loading"></div>
                   
                   <div className="flex items-center gap-4 px-4 py-3">
                       <div className="relative flex-shrink-0">
                           <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 animate-pulse"></div>
                           <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 text-white p-2 rounded-xl shadow-inner">
                               <CpuChipIcon className="w-6 h-6 animate-spin-slow" />
                           </div>
                       </div>
                       
                       <div className="flex-1 min-w-0 text-center">
                           <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-0.5">Status do Sistema</p>
                           <p className="text-sm md:text-base font-bold text-zinc-800 tracking-wide animate-pulse truncate">
                              {loadingText}
                           </p>
                       </div>

                       <div className="flex gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-[bounce_1s_infinite_0ms]"></span>
                           <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-[bounce_1s_infinite_200ms]"></span>
                           <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-[bounce_1s_infinite_400ms]"></span>
                       </div>
                   </div>
                </div>
                
                {/* Reflection/Glow below the card */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-4 bg-blue-500/20 blur-xl rounded-[100%]"></div>
             </div>
          </div>
        ) : creation?.html ? (
          <>
            {/* Split View: Left Panel (Original Image) */}
            {showSplitView && creation.originalImage && (
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-200 bg-zinc-100 relative flex flex-col shrink-0">
                    <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur text-zinc-600 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-200">
                        Fonte de Entrada
                    </div>
                    <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
                        {creation.originalImage.startsWith('data:application/pdf') ? (
                            <PdfRenderer dataUrl={creation.originalImage} />
                        ) : (
                            <img 
                                src={creation.originalImage} 
                                alt="Original Input" 
                                className="max-w-full max-h-full object-contain shadow-xl border border-zinc-200 rounded"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* App Preview Panel */}
            <div className={`relative h-full bg-white transition-all duration-500 ${showSplitView && creation.originalImage ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'}`}>
                 <iframe
                    title="Gemini Live Preview"
                    srcDoc={creation.html}
                    className="w-full h-full"
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
