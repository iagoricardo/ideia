
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
import { ArrowUpTrayIcon, UserCircleIcon, ArrowLeftOnRectangleIcon, Squares2X2Icon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { Vortex } from './components/Vortex';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';

// Define User Interface
interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  proExpiresAt?: string | null; // New field for expiration
}

// Email do Admin (Hardcoded para segurança no frontend, idealmente usar Roles no DB)
const ADMIN_EMAIL = 'admin@ainlo.com';
// Link de Pagamento Stripe
const STRIPE_LINK = "https://buy.stripe.com/3cI9AV65EeNea3B2EkaAw00";

const App: React.FC = () => {
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);
  const [importInputRef] = [useRef<HTMLInputElement>(null)];

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard' | 'admin'>('home');
  const [pendingGeneration, setPendingGeneration] = useState<{prompt: string, file?: File} | null>(null);

  // Function to sync/heal profile in database
  // Using upsert to ensure data consistency
  const syncUserProfile = async (sessionUser: any) => {
      if (!sessionUser) return;

      try {
          const isAdmin = sessionUser.email === ADMIN_EMAIL;
          
          // 1. Prepare minimal safe profile data (name/email)
          const baseProfile = {
              id: sessionUser.id,
              email: sessionUser.email,
              name: sessionUser.user_metadata.name || sessionUser.email?.split('@')[0],
          };

          // 2. Attempt basic upsert first
          const { error } = await supabase.from('profiles').upsert(baseProfile, { 
              onConflict: 'id',
              ignoreDuplicates: true 
          });

          if (error) {
               console.warn("Profile basic sync warning:", error.message);
          }

          // 3. If Admin, try to enforce role separately
          if (isAdmin) {
             await supabase.from('profiles').update({ role: 'admin' }).eq('id', sessionUser.id);
          }

      } catch (err) {
          console.error("Profile sync unexpected error:", err);
      }
  };

  // Check Auth on Mount with Supabase
  useEffect(() => {
    const checkSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                // Initial basic user data
                const userData: User = {
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                    plan: 'free',
                    proExpiresAt: null
                };
                setUser(userData);

                // Background fetch for Plan details and Expiration
                supabase
                    .from('profiles')
                    .select('plan, role, pro_expires_at')
                    .eq('id', session.user.id)
                    .single()
                    .then(({ data: profile }) => {
                        if (profile) {
                            setUser(prev => {
                                if (!prev) return null;
                                
                                // Check expiration logic
                                let finalPlan = (profile.plan as 'free' | 'pro') || 'free';
                                const expiresAt = profile.pro_expires_at;
                                
                                if (finalPlan === 'pro' && expiresAt) {
                                    const expirationDate = new Date(expiresAt);
                                    if (expirationDate < new Date()) {
                                        // Expired! Revert to free locally (DB update ideally happens via backend/cron)
                                        finalPlan = 'free';
                                    }
                                }

                                return {
                                    ...prev,
                                    plan: finalPlan,
                                    proExpiresAt: expiresAt
                                };
                            });
                        }
                    });
                
                syncUserProfile(session.user);
            }
        } catch (e) {
            console.error("Session check error", e);
        }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            setHistory([]);
            setActiveCreation(null);
            setView('home');
        } else if (event === 'SIGNED_IN' || session?.user) {
             if (!user) {
                 setUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                    plan: 'free'
                });
             }
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
  }, [user?.id]);


  // --- AUTH ACTIONS ---

  const handleAuth = async (email: string, password: string, name: string, isLogin: boolean) => {
      try {
          let sessionUser = null;

          if (isLogin) {
              const { data, error } = await supabase.auth.signInWithPassword({
                  email,
                  password
              });
              if (error) throw error;
              sessionUser = data.user;
              
          } else {
              const { data, error } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                      data: { name, plan: 'free' }
                  }
              });
              if (error) throw error;
              sessionUser = data.user;
              
              if (sessionUser && !data.session) {
                 throw new Error("Email confirmation required");
              }
          }
          
          if (sessionUser) {
              const userName = name || sessionUser.user_metadata.name || sessionUser.email!.split('@')[0];
              
              // Optimistic Update
              setUser({
                  id: sessionUser.id,
                  email: sessionUser.email!,
                  name: userName,
                  plan: 'free'
              });

              setIsAuthOpen(false);
              
              if (pendingGeneration) {
                  setTimeout(() => {
                      handleGenerateAuthenticated(pendingGeneration.prompt, pendingGeneration.file);
                      setPendingGeneration(null);
                  }, 500);
              } else {
                  setView('dashboard');
              }

              setTimeout(() => {
                  syncUserProfile(sessionUser);
                  // Re-fetch profile to get actual Plan status
                  supabase
                    .from('profiles')
                    .select('plan, pro_expires_at')
                    .eq('id', sessionUser.id)
                    .single()
                    .then(({ data }) => {
                        if (data) {
                             setUser(prev => prev ? { ...prev, plan: data.plan, proExpiresAt: data.pro_expires_at } : null);
                        }
                    });
              }, 100);
          }
      } catch (err) {
          throw err;
      }
  };

  const handleLogout = async () => {
      setUser(null);
      setActiveCreation(null);
      setHistory([]);
      setView('home');

      try {
          await supabase.auth.signOut();
      } catch (error) {
          console.error("Error signing out:", error);
      }
  };

  const handleUpgrade = () => {
      if (!user) return;
      window.open(STRIPE_LINK, '_blank');
  };

  // --- GENERATION LOGIC ---

  const checkLimits = () => {
      if (!user) return false;
      if (user.plan === 'pro') return true;
      return history.length < 3;
  };

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
        
        {!isFocused && (
             <div className="w-full max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center z-20 relative">
                <div className="text-xl font-bold text-zinc-900 cursor-pointer flex items-center gap-3" onClick={() => setView('home')}>
                    <img src="https://i.ibb.co/LhdJ5Qwc/Image-fx-2-Photoroom.png" alt="Ainlo Logo" className="h-10 w-auto" />
                    
                </div>
                <div className="flex gap-3">
                    {user ? (
                        <div className="flex items-center gap-3">
                             {user.email === ADMIN_EMAIL && (
                                 <button
                                    onClick={() => setView('admin')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium text-sm ${view === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-white/50 hover:bg-purple-50 text-zinc-700'}`}
                                 >
                                     <ShieldCheckIcon className="w-5 h-5" />
                                     Admin
                                 </button>
                             )}
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
            {view === 'admin' && user?.email === ADMIN_EMAIL ? (
                <div className="flex-1 w-full py-8">
                    <AdminDashboard onBack={() => setView('home')} />
                </div>
            ) : view === 'dashboard' && user ? (
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

        <LivePreview
            creation={activeCreation}
            isLoading={isGenerating}
            isFocused={isFocused}
            onReset={handleReset}
        />

        <AuthModal 
            isOpen={isAuthOpen} 
            onClose={() => {
                setIsAuthOpen(false);
                setPendingGeneration(null);
            }}
            onAuth={handleAuth}
            pendingAction={pendingGeneration ? 'upload' : undefined}
        />

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
