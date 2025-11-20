
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
import { ArrowUpTrayIcon, UserCircleIcon, ArrowLeftOnRectangleIcon, Squares2X2Icon } from '@heroicons/react/24/solid';
import { Vortex } from './components/Vortex';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';

// Define User Interface
interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
}

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [pendingGeneration, setPendingGeneration] = useState<{prompt: string, file?: File} | null>(null);

  // Check Auth on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem('ainlo_user');
    if (savedUser) {
        setUser(JSON.parse(savedUser));
        setView('dashboard'); // Direct to dashboard if logged in
    }
  }, []);

  // Load History dependent on User
  useEffect(() => {
    const loadUserHistory = async () => {
      // If no user, we might show examples or temp history, but for this SaaS logic
      // we want history to be tied to the user.
      // Let's use a generic key for guest/logged-out for examples, and specific key for users.
      
      const storageKey = user ? `gemini_app_history_${user.id}` : 'gemini_app_history_guest';
      const saved = localStorage.getItem(storageKey);
      
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

      if (hasSavedData) {
        setHistory(loadedHistory);
      } else if (!user) {
         // Load examples ONLY for guest/landing page to look nice
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
      } else {
          setHistory([]); // New user has empty history
      }
      
      setIsHistoryLoaded(true);
    };

    loadUserHistory();
  }, [user]);

  // Save history when it changes
  useEffect(() => {
    if (!isHistoryLoaded) return;
    const storageKey = user ? `gemini_app_history_${user.id}` : 'gemini_app_history_guest';

    try {
        localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (e) {
        console.warn("Local storage full or error saving history", e);
    }
  }, [history, isHistoryLoaded, user]);


  // --- AUTH ACTIONS ---

  const handleLogin = (email: string, name: string) => {
      // Simulate Backend Login/Signup
      const mockId = email.replace(/[^a-zA-Z0-9]/g, '');
      const newUser: User = {
          id: mockId,
          email,
          name,
          plan: 'free' // Default to free
      };
      
      // Save Session
      localStorage.setItem('ainlo_user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthOpen(false);

      // Resume pending generation if exists
      if (pendingGeneration) {
          // We delay slightly to allow state to settle
          setTimeout(() => {
              handleGenerateAuthenticated(pendingGeneration.prompt, pendingGeneration.file);
              setPendingGeneration(null);
          }, 100);
      } else {
          setView('dashboard');
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('ainlo_user');
      setUser(null);
      setView('home');
      setActiveCreation(null);
  };

  const handleUpgrade = () => {
      if (!user) return;
      // Mock Upgrade
      const upgradedUser: User = { ...user, plan: 'pro' };
      setUser(upgradedUser);
      localStorage.setItem('ainlo_user', JSON.stringify(upgradedUser));
      alert("Parabéns! Você agora é PRO e tem gerações ilimitadas.");
  };

  // --- GENERATION LOGIC ---

  const checkLimits = () => {
      if (!user) return false;
      if (user.plan === 'pro') return true;
      return history.length < 3;
  };

  // Initial entry point from InputArea
  const handleGenerateRequest = (promptText: string, file?: File) => {
      if (!user) {
          setPendingGeneration({ prompt: promptText, file });
          setIsAuthOpen(true);
          return;
      }

      handleGenerateAuthenticated(promptText, file);
  };

  const handleGenerateAuthenticated = async (promptText: string, file?: File) => {
    if (!checkLimits()) {
        alert("Você atingiu o limite de 3 arquivos do Plano Gratuito. Apague alguns projetos antigos no Dashboard ou faça upgrade para o Plano Pro.");
        setView('dashboard');
        return;
    }

    setIsGenerating(true);
    setActiveCreation(null);

    try {
      let imageBase64: string | undefined;
      let mimeType: string | undefined;

      // Helper to convert file to base64
      const fileToBase64 = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(f);
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            } else reject(new Error('Failed'));
          };
          reader.onerror = reject;
        });
      };

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
            if (parsed.html && parsed.name) {
                const importedCreation: Creation = {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp || Date.now()),
                    id: parsed.id || crypto.randomUUID()
                };
                setHistory(prev => [importedCreation, ...prev]);
                setActiveCreation(importedCreation);
            } else {
                alert("Formato inválido.");
            }
        } catch (err) {
            alert("Falha ao importar.");
        }
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
        
        {/* Header Nav (Only show if not focused on creation) */}
        {!isFocused && (
             <div className="w-full max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center z-20 relative">
                <div className="text-xl font-bold text-zinc-900 cursor-pointer" onClick={() => setView('home')}>
                    Ainlo
                </div>
                <div className="flex gap-3">
                    {user ? (
                        <div className="flex items-center gap-3">
                             <button 
                                onClick={() => setView(view === 'dashboard' ? 'home' : 'dashboard')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${view === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'bg-white/50 hover:bg-white text-zinc-700'}`}
                             >
                                <Squares2X2Icon className="w-5 h-5" />
                                Dashboard
                             </button>
                             <button 
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/50 hover:bg-red-50 text-zinc-700 hover:text-red-600 transition-colors font-medium text-sm"
                             >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                                Sair
                             </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAuthOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-transform hover:scale-105 font-medium text-sm shadow-lg"
                        >
                            <UserCircleIcon className="w-5 h-5" />
                            Entrar / Cadastrar
                        </button>
                    )}
                </div>
             </div>
        )}

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
            {view === 'dashboard' && user ? (
                 /* --- DASHBOARD VIEW --- */
                 <div className="flex-1 w-full py-8">
                     <UserDashboard 
                        user={user} 
                        history={history} 
                        onSelect={handleSelectCreation}
                        onDelete={handleDeleteCreation}
                        onNew={() => setView('home')}
                        onUpgrade={handleUpgrade}
                     />
                 </div>
            ) : (
                /* --- HOME / LANDING VIEW --- */
                <>
                    <div className="flex-1 flex flex-col justify-center items-center w-full py-12 md:py-20">
                        <div className="w-full mb-8 md:mb-16">
                            <Hero />
                        </div>
                        <div className="w-full flex justify-center mb-8">
                            <InputArea onGenerate={handleGenerateRequest} isGenerating={isGenerating} disabled={isFocused} />
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-8">
                        {/* Show recent history on home only if logged out or just a few items */}
                        {!user && history.length > 0 && (
                             <div className="w-full px-2 md:px-0">
                                <CreationHistory history={history} onSelect={handleSelectCreation} onDelete={handleDeleteCreation} />
                            </div>
                        )}
                        
                        <div className="w-full">
                            <FeaturesSection />
                        </div>
                        <div className="w-full">
                            <PricingWithChart />
                        </div>
                        <a 
                        href="https://www.instagram.com/iagoricardo.br" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-zinc-800 text-xs font-mono transition-colors pb-4"
                        >
                        Criado por @iagoricardo.br
                        </a>
                    </div>
                </>
            )}
        </div>

        {/* Live Preview */}
        <LivePreview
            creation={activeCreation}
            isLoading={isGenerating}
            isFocused={isFocused}
            onReset={handleReset}
        />

        {/* Auth Modal */}
        <AuthModal 
            isOpen={isAuthOpen} 
            onClose={() => {
                setIsAuthOpen(false);
                setPendingGeneration(null);
            }}
            onLogin={handleLogin}
            pendingAction={pendingGeneration ? 'upload' : undefined}
        />

        {/* Import Button */}
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
