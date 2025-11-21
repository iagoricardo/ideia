
import React from 'react';
import { Creation } from './CreationHistory';
import { ClockIcon, TrashIcon, ArrowRightIcon, StarIcon, SparklesIcon, CloudIcon, PlusIcon, ArrowUpTrayIcon, CalendarIcon, CodeBracketIcon, CubeIcon, HeartIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';

interface UserDashboardProps {
  user: { name: string; email: string; plan: 'free' | 'pro'; proExpiresAt?: string | null };
  history: Creation[];
  onSelect: (creation: Creation) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onUpgrade: () => void;
}

const ProjectThumbnail = ({ src, name }: { src?: string, name: string }) => {
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setError(false);
  }, [src]);

  // Check for PDF
  if (src?.startsWith('data:application/pdf')) {
     return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
            <DocumentIcon className="w-10 h-10 text-red-500" />
        </div>
     );
  }

  const getPlaceholderStyle = (str: string) => {
      const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const styles = [
          { bg: 'bg-blue-50', text: 'text-blue-500', icon: CodeBracketIcon },
          { bg: 'bg-purple-50', text: 'text-purple-500', icon: SparklesIcon },
          { bg: 'bg-pink-50', text: 'text-pink-500', icon: HeartIcon },
          { bg: 'bg-emerald-50', text: 'text-emerald-500', icon: CubeIcon },
          { bg: 'bg-amber-50', text: 'text-amber-500', icon: StarIcon },
      ];
      return styles[hash % styles.length];
  };

  const style = getPlaceholderStyle(name);
  const Icon = style.icon;

  if (!src || error) {
      return (
          <div className={`w-full h-full flex items-center justify-center ${style.bg}`}>
              <Icon className={`w-10 h-10 ${style.text}`} />
          </div>
      );
  }

  return (
      <img 
          src={src} 
          className="max-w-full max-h-full object-contain shadow-sm" 
          alt={name} 
          onError={() => setError(true)}
      />
  );
};

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, history, onSelect, onDelete, onNew, onUpgrade }) => {
  const isPro = user.plan === 'pro';
  const limit = isPro ? Infinity : 3;
  const used = history.length;
  const percentage = Math.min(100, (used / (isPro ? 100 : limit)) * 100); // Scale Pro visually to 100 for bar, but it is unlimited

  // Calculate days remaining
  let daysRemaining = 0;
  if (isPro && user.proExpiresAt) {
      const now = new Date();
      const expires = new Date(user.proExpiresAt);
      const diffTime = Math.abs(expires.getTime() - now.getTime());
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Pro Expiration Banner */}
      {isPro && user.proExpiresAt && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
              <CalendarIcon className="w-5 h-5 text-amber-600" />
              <div>
                  <span className="font-bold">Seu Plano Pro está ativo!</span>
                  <span className="text-sm ml-1 opacity-90">Você tem {daysRemaining} dias restantes de acesso ilimitado.</span>
              </div>
          </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-200 flex items-center justify-center text-2xl font-bold text-blue-600">
                {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 className="text-xl font-bold text-zinc-900">{user.name}</h2>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isPro ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                        {isPro ? <StarIcon className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" /> : null}
                        {isPro ? 'PLANO PRO' : 'PLANO GRATUITO'}
                    </span>
                </div>
            </div>
        </div>

        {/* Usage Stats */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-zinc-500">Armazenamento de Projetos</span>
                <span className="text-2xl font-bold text-zinc-900">{used} <span className="text-sm text-zinc-400 font-normal">/ {isPro ? '∞' : limit}</span></span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-1000 ${percentage >= 100 && !isPro ? 'bg-red-500' : 'bg-blue-500'}`} 
                    style={{ width: `${isPro ? 5 : percentage}%` }}
                ></div>
            </div>
            {!isPro && percentage >= 100 && (
                <p className="text-xs text-red-500 mt-2 font-medium flex items-center">
                    <CloudIcon className="w-3 h-3 mr-1" />
                    Limite atingido. Apague itens ou faça upgrade.
                </p>
            )}
        </div>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 rounded-2xl border border-zinc-700 shadow-lg text-white flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
            <div>
                <h3 className="font-bold text-lg mb-1">Criar Novo Projeto</h3>
                <p className="text-zinc-400 text-sm">Dê vida a uma nova ideia agora.</p>
            </div>
            <button 
                onClick={onNew}
                disabled={!isPro && used >= limit}
                className={`mt-4 w-full border py-2 rounded-lg transition-all flex items-center justify-center gap-2 font-medium backdrop-blur-sm ${
                    !isPro && used >= limit 
                    ? 'bg-zinc-700/50 border-zinc-600 text-zinc-400 cursor-not-allowed' 
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
            >
                {(!isPro && used >= limit) ? (
                    <span>Limite Atingido</span>
                ) : (
                    <>
                        <PlusIcon className="w-4 h-4" />
                        Nova Geração
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Upgrade Banner (Only for Free users) */}
      {!isPro && (
          <div 
            onClick={onUpgrade}
            className="cursor-pointer relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 shadow-lg text-white group"
          >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                          <SparklesIcon className="w-8 h-8 text-yellow-300" />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold mb-1">Desbloqueie o Potencial Ilimitado</h3>
                          <p className="text-blue-100 text-sm max-w-md">
                              Gere projetos sem limites, exporte códigos complexos e remova todas as restrições do plano gratuito.
                          </p>
                      </div>
                  </div>
                  <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2 whitespace-nowrap">
                      Fazer Upgrade Agora
                      <ArrowRightIcon className="w-4 h-4" />
                  </button>
              </div>
          </div>
      )}

      {/* Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-zinc-900">Meus Projetos</h2>
        </div>

        {history.length === 0 ? (
            <div className="text-center py-20 bg-white/50 rounded-2xl border border-dashed border-zinc-300">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowUpTrayIcon className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900">Nenhum projeto ainda</h3>
                <p className="text-zinc-500 max-w-xs mx-auto mt-2">Faça o upload de um arquivo para começar a criar seu portfólio.</p>
                <button onClick={onNew} className="mt-6 text-blue-600 font-medium hover:underline">Começar agora</button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {history.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="group bg-white border border-zinc-200 hover:border-blue-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-64 relative"
                    >
                         {/* Preview Area */}
                         <div className="h-32 bg-zinc-100 relative overflow-hidden flex items-center justify-center p-4 border-b border-zinc-100">
                            <ProjectThumbnail src={item.originalImage} name={item.name} />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                         </div>

                         {/* Content Area */}
                         <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-zinc-900 truncate mb-1">{item.name}</h3>
                            <div className="flex items-center text-xs text-zinc-500 mb-4">
                                <ClockIcon className="w-3.5 h-3.5 mr-1" />
                                {item.timestamp.toLocaleDateString()} às {item.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>

                            <div className="mt-auto flex justify-between items-center pt-3 border-t border-zinc-50">
                                <span className="text-xs font-medium text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Abrir <ArrowRightIcon className="w-3 h-3" />
                                </span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(item.id);
                                    }}
                                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    title="Apagar projeto"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                         </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
