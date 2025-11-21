
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowDownTrayIcon, 
  PlusIcon, 
  ViewColumnsIcon, 
  DocumentIcon, 
  CodeBracketIcon, 
  XMarkIcon, 
  CpuChipIcon,
  ShareIcon,
  LinkIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
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
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

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

    // Simulated share URL
    const shareUrl = creation ? `https://ainlo.advoga.shop/v/${creation.id.slice(0, 8)}` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const socialShare = (platform: 'whatsapp' | 'linkedin' | 'twitter') => {
        const text = `Confira este aplicativo que criei com Ainlo: "${creation?.name}"`;
        let url = '';

        switch (platform) {
            case 'whatsapp':
                url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
                break;
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'linkedin':
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                break;
        }
        window.open(url, '_blank');
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
        <div className="flex items-center justify-end space-x-1 w-40">
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
                        onClick={() => setShowShareModal(true)}
                        title="Compartilhar"
                        className="text-zinc-500 hover:text-blue-600 transition-colors p-1.5 rounded-md hover:bg-blue-50"
                    >
                        <ShareIcon className="w-4 h-4" />
                    </button>

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
                
                {/* Logo Reposicionado - Canto Superior Direito */}
                <div className="absolute top-8 right-8 z-30 w-32 sm:w-48 animate-[float_6s_ease-in-out_infinite]">
                    <div className="relative">
                        {/* Glow Effect behind logo */}
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
                        <img 
                            src="https://i.ibb.co/LhdJ5Qwc/Image-fx-2-Photoroom.png" 
                            className="relative w-full h-full object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            alt="Platform Logo"
                        />
                    </div>
                </div>
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
             </div>
          </div>
        ) : (
            <div className="flex w-full h-full">
                {/* Left Side: Original Asset (Split View) */}
                {showSplitView && creation?.originalImage && (
                    <div className="w-1/2 h-full border-r border-zinc-200 bg-zinc-100/50 relative flex flex-col animate-in slide-in-from-left duration-500">
                        <div className="p-2 bg-white border-b border-zinc-200 flex justify-between items-center shadow-sm z-10">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 pl-2">Original</span>
                        </div>
                        <div className="flex-1 overflow-hidden p-4 flex items-center justify-center">
                            {creation.originalImage.startsWith('data:application/pdf') ? (
                                <PdfRenderer dataUrl={creation.originalImage} />
                            ) : (
                                <img 
                                    src={creation.originalImage} 
                                    alt="Original" 
                                    className="max-w-full max-h-full object-contain shadow-lg border border-zinc-200 rounded-lg bg-white" 
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Right/Main Side: Generated Application */}
                <div className={`h-full transition-all duration-500 relative bg-white ${showSplitView ? 'w-1/2' : 'w-full'}`}>
                    <iframe
                        title="Generated App"
                        srcDoc={creation?.html}
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                    />
                </div>
            </div>
        )}
      </div>

      {/* Share Modal Overlay */}
      {showShareModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-sm overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                      <h3 className="text-sm font-bold text-zinc-900">Compartilhar Criação</h3>
                      <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-zinc-700">
                          <XMarkIcon className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-5 space-y-6">
                      {/* Social Buttons */}
                      <div className="grid grid-cols-3 gap-3">
                          <button 
                            onClick={() => socialShare('whatsapp')}
                            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-green-50 text-zinc-600 hover:text-green-600 transition-colors border border-zinc-200 hover:border-green-200"
                          >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                              <span className="text-[10px] font-medium">WhatsApp</span>
                          </button>
                          
                          <button 
                             onClick={() => socialShare('linkedin')}
                             className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-blue-50 text-zinc-600 hover:text-blue-700 transition-colors border border-zinc-200 hover:border-blue-200"
                          >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                              <span className="text-[10px] font-medium">LinkedIn</span>
                          </button>
                          
                          <button 
                             onClick={() => socialShare('twitter')}
                             className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-slate-50 text-zinc-600 hover:text-slate-900 transition-colors border border-zinc-200 hover:border-slate-300"
                          >
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                              <span className="text-[10px] font-medium">X / Twitter</span>
                          </button>
                      </div>

                      {/* Copy Link Input */}
                      <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 uppercase">Link do Projeto</label>
                          <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                  <input 
                                      type="text" 
                                      value={shareUrl} 
                                      readOnly 
                                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                              </div>
                              <button 
                                  onClick={copyToClipboard}
                                  className={`p-2.5 rounded-lg border transition-all duration-200 flex items-center justify-center min-w-[44px] ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-zinc-200 text-zinc-600 hover:border-blue-300 hover:text-blue-600'}`}
                              >
                                  {copied ? <ClipboardDocumentCheckIcon className="w-5 h-5" /> : <ClipboardDocumentIcon className="w-5 h-5" />}
                              </button>
                          </div>
                          {copied && <p className="text-xs text-green-600 animate-in fade-in slide-in-from-left-1">Link copiado para a área de transferência!</p>}
                      </div>
                  </div>
                  
                  <div className="p-4 bg-zinc-50 border-t border-zinc-100 text-center">
                      <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">
                          Este link permite que qualquer pessoa visualize e interaja com este aplicativo gerado.
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
