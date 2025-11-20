
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { UserIcon, CheckBadgeIcon, StarIcon, ArrowLeftIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Profile {
    id: string;
    email: string;
    name: string;
    plan: 'free' | 'pro';
    role: 'user' | 'admin';
}

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    setRefreshing(true);
    // Note: This assumes 'profiles' table exists and RLS allows reading.
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (data) {
        setUsers(data as Profile[]);
    }
    if (error) {
        console.error("Error loading profiles:", error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = async () => {
      await fetchUsers();
      alert("Lista atualizada com sucesso!");
  };

  const togglePlan = async (id: string, currentPlan: string) => {
      // Ensure strict checking
      const normalizedPlan = currentPlan?.toLowerCase() || 'free';
      const newPlan = normalizedPlan === 'pro' ? 'free' : 'pro';
      
      // Optimistic update
      setUsers(prevUsers => prevUsers.map(u => u.id === id ? { ...u, plan: newPlan as 'free'|'pro' } : u));

      const { error } = await supabase
        .from('profiles')
        .update({ plan: newPlan })
        .eq('id', id);
        
      if (error) {
          console.error("Failed to update plan:", error);
          alert("Erro ao atualizar plano. Verifique suas permissões ou a conexão.");
          // Revert optimistic update
          setUsers(prevUsers => prevUsers.map(u => u.id === id ? { ...u, plan: normalizedPlan as 'free'|'pro' } : u));
      } else {
          alert(`Plano atualizado para ${newPlan.toUpperCase()} com sucesso!`);
      }
  };

  const deleteUser = async (id: string, name: string) => {
      if (!window.confirm(`Tem certeza que deseja remover o usuário "${name}"? Isso removerá o acesso dele ao painel.`)) {
          return;
      }

      // Optimistic remove from UI
      setUsers(prevUsers => prevUsers.filter(u => u.id !== id));

      const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

      if (error) {
          console.error("Error deleting user:", error);
          alert("Erro ao excluir usuário. Pode haver restrições no banco de dados.");
          // Reload to restore state if failed
          fetchUsers();
      } else {
          alert("Usuário excluído com sucesso.");
      }
  };

  return (
      <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-zinc-200 mt-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-8 border-b border-zinc-100 pb-4">
              <div>
                  <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                      <CheckBadgeIcon className="w-8 h-8 text-purple-600" />
                      Painel Administrativo
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">Gerencie usuários e permissões de acesso</p>
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                    title="Recarregar lista"
                  >
                      <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      {refreshing ? 'Atualizando...' : 'Atualizar Lista'}
                  </button>
                  <button 
                    onClick={onBack} 
                    className="flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                      <ArrowLeftIcon className="w-4 h-4" />
                      Voltar
                  </button>
              </div>
          </div>

          {loading && users.length === 0 ? (
              <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
          ) : users.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <UserIcon className="w-12 h-12 mx-auto text-zinc-300 mb-2" />
                  <p className="text-zinc-500">Nenhum usuário encontrado.</p>
                  <p className="text-xs text-zinc-400 mt-2">Se usuários existem mas não aparecem, clique em "Atualizar Lista".</p>
              </div>
          ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase font-semibold text-xs tracking-wider">
                          <tr>
                              <th className="px-6 py-4">Usuário</th>
                              <th className="px-6 py-4">Email</th>
                              <th className="px-6 py-4">Plano Atual</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                          {users.map((u) => {
                              const isPro = u.plan?.toLowerCase() === 'pro';
                              return (
                                <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-zinc-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                                            {u.name ? u.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        {u.name || 'Sem nome'}
                                        {u.role === 'admin' && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-white text-[10px]">ADMIN</span>}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            isPro
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                        }`}>
                                            {isPro && <StarIcon className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />}
                                            {u.plan ? u.plan.toUpperCase() : 'FREE'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {u.role !== 'admin' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => togglePlan(u.id, u.plan)}
                                                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors border flex items-center gap-1 ${
                                                        isPro
                                                        ? 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                                                        : 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-sm'
                                                    }`}
                                                >
                                                    {isPro ? (
                                                        <>Remover Pro</>
                                                    ) : (
                                                        <>
                                                            <StarIcon className="w-3 h-3" />
                                                            Presentear Pro
                                                        </>
                                                    )}
                                                </button>
                                                
                                                <button
                                                    onClick={() => deleteUser(u.id, u.name)}
                                                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                                                    title="Excluir Usuário"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}
      </div>
  );
};
