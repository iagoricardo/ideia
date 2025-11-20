
import React, { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (email: string, password: string, name: string, isLogin: boolean) => Promise<void>;
  pendingAction?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuth, pendingAction }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
      if (isOpen) {
          setError(null);
          setSuccessMessage(null);
          setLoading(false);
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    
    try {
        const finalName = name || email.split('@')[0];
        await onAuth(email, password, finalName, isLogin);
        // Successful Auth will trigger onClose from parent via props state change
        // But we also reset loading here just in case
        if (isLogin) setLoading(false); 
    } catch (err: any) {
        console.error("Erro de autenticação:", err);
        let msg = err.message || "Ocorreu um erro. Verifique suas credenciais.";
        
        // Tradução e refinamento de erros comuns do Supabase
        if (msg.includes("Email logins are disabled")) {
            msg = "O login por Email está desativado no Supabase. Habilite em Authentication > Providers > Email.";
        } else if (msg.includes("Invalid login credentials")) {
            // Esse erro pode ser senha errada OU email não confirmado
            msg = "Email ou senha incorretos (ou conta não confirmada). Verifique seu email ou cadastre-se.";
        } else if (msg.includes("User already registered")) {
            msg = "Este email já está cadastrado. Tente fazer login.";
        } else if (msg.includes("Password should be")) {
            msg = "A senha é muito fraca. Use pelo menos 6 caracteres.";
        } else if (msg.includes("Email confirmation required")) {
             setSuccessMessage("Cadastro realizado com sucesso! Verifique seu email para confirmar sua conta antes de entrar.");
             setLoading(false);
             return; // Não define erro, mostra mensagem de sucesso
        }
        
        setError(msg);
        setLoading(false); // Stop loading only on error
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 transition-colors"
        >
            <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="p-8">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                    {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h2>
                <p className="text-sm text-zinc-500">
                    {pendingAction 
                        ? "Faça login para processar seu arquivo e ver o resultado." 
                        : "Acesse seu painel e gerencie seus projetos."}
                </p>
            </div>

            {successMessage ? (
                <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 text-center">
                    <p className="font-bold mb-1">Quase lá!</p>
                    {successMessage}
                    <button 
                        onClick={() => {
                            setIsLogin(true);
                            setSuccessMessage(null);
                        }}
                        className="mt-3 text-green-800 underline font-semibold"
                    >
                        Ir para Login
                    </button>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-zinc-500 uppercase">Nome</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                    <input 
                                        type="text" 
                                        required={!isLogin}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Email</label>
                            <div className="relative">
                                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Senha</label>
                            <div className="relative">
                                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                isLogin ? 'Entrar' : 'Criar Conta Grátis'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-500">
                            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                            <button 
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className="ml-1 text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                            >
                                {isLogin ? 'Cadastre-se' : 'Faça Login'}
                            </button>
                        </p>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
