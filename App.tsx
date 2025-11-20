
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory, Creation } from './components/CreationHistory';
import { FeaturesSection } from './components/Features';
import { PricingWithChart } from './components/Pricing';
import { bringToLife } from './services/gemini';
import { ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { Vortex } from './components/Vortex';

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load history from local storage or fetch examples on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('gemini_app_history');
      let loadedHistory: Creation[] = [];
      let hasSavedData = false;

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
              ...item,
              timestamp: new Date(item.timestamp)
          }));
          hasSavedData = true;
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (hasSavedData && loadedHistory.length > 0) {
        setHistory(loadedHistory);
      } else if (!hasSavedData) {
        // If no history (new user), load examples
        try {
           const exampleUrls = [
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/vibecode-blog.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/cassette.json',
               'https://storage.googleapis.com/sideprojects-asronline/bringanythingtolife/chess.json'
           ];

           const examples = await Promise.all(exampleUrls.map(async (url) => {
               const res = await fetch(url);
               if (!res.ok) return null;
               const data = await res.json();
               return {
                   ...data,
                   timestamp: new Date(data.timestamp || Date.now()),
                   id: data.id || crypto.randomUUID()
               };
           }));
           
           const validExamples = examples.filter((e): e is Creation => e !== null);
           if (validExamples.length > 0) {
               setHistory(validExamples);
           }
        } catch (e) {
            console.error("Failed to load examples", e);
        }
      }
      
      // Mark history as loaded so we can start saving updates
      setIsHistoryLoaded(true);
    };

    initHistory();
  }, []);

  // Save history when it changes - Only after initial load
  useEffect(() => {
    if (!isHistoryLoaded) return;

    try {
        localStorage.setItem('gemini_app_history', JSON.stringify(history));
    } catch (e) {
        console.warn("Local storage full or error saving history", e);
    }
  }, [history, isHistoryLoaded]);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = async (promptText: string, file?: File) => {
    setIsGenerating(true);
    // Clear active creation to show loading state
    setActiveCreation(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      if (file) {
        imageBase64 = await fileToBase64(file);
        mimeType = file.type.toLowerCase();
      }

      const html = await bringToLife(promptText, imageBase64, mimeType);
      
      if (html) {
        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: file ? file.name : 'Nova Criação',
          html: html,
          // Store the full data URL for easy display
          originalImage: imageBase64 && mimeType ? `data:${mimeType};base64,${imageBase64}` : undefined,
          timestamp: new Date(),
        };
        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);
      }

    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Algo deu errado ao dar vida ao seu arquivo. Por favor, tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
  };

  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  const handleDeleteCreation = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (activeCreation?.id === id) {
        setActiveCreation(null);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = event.target?.result as string;
            const parsed = JSON.parse(json);
            
            // Basic validation
            if (parsed.html && parsed.name) {
                const importedCreation: Creation = {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp || Date.now()),
                    id: parsed.id || crypto.randomUUID()
                };
                
                // Add to history if not already there (by ID check)
                setHistory(prev => {
                    const exists = prev.some(c => c.id === importedCreation.id);
                    return exists ? prev : [importedCreation, ...prev];
                });

                // Set as active immediately
                setActiveCreation(importedCreation);
            } else {
                alert("Formato de arquivo de criação inválido.");
            }
        } catch (err) {
            console.error("Import error", err);
            alert("Falha ao importar criação.");
        }
        // Reset input
        if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const isFocused = !!activeCreation || isGenerating;

  return (
    <Vortex
      backgroundColor="transparent"
      rangeY={800}
      particleCount={500}
      baseHue={200}
      className="h-[100dvh] overflow-hidden"
      containerClassName="bg-dot-grid"
    >
        <div className="h-[100dvh] text-zinc-900 selection:bg-blue-500/20 overflow-y-auto overflow-x-hidden relative flex flex-col">
        
        {/* Centered Content Container */}
        <div 
            className={`
            min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
            transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
            ${isFocused 
                ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden' 
                : 'opacity-100 scale-100 blur-0'
            }
            `}
        >
            {/* Main Vertical Centering Wrapper */}
            <div className="flex-1 flex flex-col justify-center items-center w-full py-12 md:py-20">
            
            {/* 1. Hero Section */}
            <div className="w-full mb-8 md:mb-16">
                <Hero />
            </div>

            {/* 2. Input Section */}
            <div className="w-full flex justify-center mb-8">
                <InputArea onGenerate={handleGenerate} isGenerating={isGenerating} disabled={isFocused} />
            </div>

            </div>
            
            {/* 3. History, Features & Pricing Section - Stays at bottom */}
            <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-8">
                {/* History List */}
                <div className="w-full px-2 md:px-0">
                    <CreationHistory history={history} onSelect={handleSelectCreation} onDelete={handleDeleteCreation} />
                </div>
                
                {/* Features Grid */}
                <div className="w-full">
                    <FeaturesSection />
                </div>

                {/* Pricing Section */}
                <div className="w-full">
                    <PricingWithChart />
                </div>

                {/* Footer Branding */}
                <a 
                href="https://www.instagram.com/iagoricardo.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-800 text-xs font-mono transition-colors pb-4"
                >
                Criado por @iagoricardo.br
                </a>
            </div>
        </div>

        {/* Live Preview - Always mounted for smooth transition */}
        <LivePreview
            creation={activeCreation}
            isLoading={isGenerating}
            isFocused={isFocused}
            onReset={handleReset}
        />

        {/* Subtle Import Button (Bottom Right) */}
        <div className="fixed bottom-4 right-4 z-50">
            <button 
                onClick={handleImportClick}
                className="flex items-center space-x-2 p-2 text-zinc-400 hover:text-zinc-800 transition-colors opacity-60 hover:opacity-100"
                title="Importar Artefato"
            >
                <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">Carregar artefato anterior</span>
                <ArrowUpTrayIcon className="w-5 h-5" />
            </button>
            <input 
                type="file" 
                ref={importInputRef} 
                onChange={handleImportFile} 
                accept=".json" 
                className="hidden" 
            />
        </div>
        </div>
    </Vortex>
  );
};

export default App;
