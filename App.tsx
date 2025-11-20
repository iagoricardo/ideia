
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
import { supabase } from './services/supabase';
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
  const [importInputRef] = [useRef<HTMLInputElement>(null)];

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard'>('home');
  const [pendingGeneration, setPendingGeneration] = useState<{prompt: string, file?: File} | null>(null);

  // Check Auth on Mount with Supabase
  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                plan: (session.user.user_metadata.plan as 'free' | 'pro') || 'free'
            });
            setView('dashboard');
        }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
             setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                plan: (session.user.user_metadata.plan as 'free' | 'pro') || 'free'
            });
        } else {
            setUser(null);
            setView('home');
        }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load History from Supabase when user changes
  useEffect(() => {
    const loadUserHistory = async () => {
      if (!user) {
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('creations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
          console.error('Error loading history:', error);
          return;
      }

      if (data) {
          const mappedHistory: Creation[] = data.map((item: any) => ({
              id: item.id,
              name: item.name,
              html: item.html,
              originalImage: item.original_image,
              timestamp: new Date(item.created_at)
          }));
          setHistory(mappedHistory);
      }
    };

    loadUserHistory();
  }, [user]);


  // --- AUTH ACTIONS ---

  const handleAuth = async (email: string, password: string, name: string, isLogin: boolean) => {
      if (isLogin) {
          const { error } = await supabase.auth.signInWithPassword({
              email,
              password
          });
          if (error) throw error;
      } else {
          const { error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                  data: { name, plan: 'free' }
              }
          });
          if (error) throw error;
      }
      
      setIsAuthOpen(false);

      // Resume pending generation if exists
      if (pendingGeneration) {
          setTimeout(() => {
              handleGenerateAuthenticated(pendingGeneration.prompt, pendingGeneration.file);
              setPendingGeneration(null);
          }, 500); // Wait for state update
      } else {
          setView('dashboard');
      }
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setActiveCreation(null);
  };

  const handleUpgrade = async () => {
      if (!user) return;
      // Mock Upgrade locally for now, in real app this would be a webhook from Stripe updating the DB
      const { error } = await supabase.auth.updateUser({
          data: { plan: 'pro' }
      });
      
      if (!error) {
          setUser({ ...user, plan: 'pro' });
          alert("Parabéns! Você agora é PRO e tem gerações ilimitadas.");
      }
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
      
      if (html && user) {
        const originalImageUri = imageBase64 && mimeType ? `data:${mimeType};base64,${imageBase64}` : undefined;
        
        // Save to Supabase
        const { data, error } = await supabase
            .from('creations')
            .insert([
                {
                    user_id: user.id,
                    name: file ? file.name : 'Nova Criação',
                    html: html,
                    original_image: originalImageUri
                }
            ])
            .select()
            .single();

        if (error) throw error;

        if (data) {
            const newCreation: Creation = {
                id: data.id,
                name: data.name,
                html: data.html,
                originalImage: data.original_image,
                timestamp: new Date(data.created_at),
            };
            setActiveCreation(newCreation);
            setHistory(prev => [newCreation, ...prev]);
        }
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

  const handleDeleteCreation = async (id: string) => {
    const { error } = await supabase
        .from('creations')
        .delete()
        .eq('id', id);

    if (!error) {
        setHistory(prev => prev.filter(item => item.id !== id));
        if (activeCreation?.id === id) {
            setActiveCreation(null);
        }
    } else {
        alert("Erro ao deletar projeto.");
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
            // Import local view only, don't save to DB unless user wants (complex logic omitted for brevity)
            if (parsed.html && parsed.name) {
                const importedCreation: Creation = {
                    ...parsed,
                    timestamp: new Date(parsed.timestamp || Date.now()),
                    id: parsed.id || crypto.randomUUID()
                };
                // We add to history state locally for viewing
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
            onAuth={handleAuth}
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
