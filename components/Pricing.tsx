
import React from 'react';
import { CheckCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';
import { CartesianGrid, Bar, BarChart, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';

// --- CONFIGURAÇÃO DO STRIPE ---
const STRIPE_CONFIG = {
  // Link fornecido pelo usuário
  paymentLinkMonthly: "https://buy.stripe.com/3cI9AV65EeNea3B2EkaAw00", 
};

export function PricingWithChart() {
  
  const handleCheckout = (plan: 'free' | 'pro') => {
      if (plan === 'free') {
          // Lógica para plano gratuito (rola para o topo para login/cadastro)
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          // Redirecionar para Stripe Payment Link
          window.open(STRIPE_CONFIG.paymentLinkMonthly, '_blank');
      }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Heading */}
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 lg:text-5xl">
          Preços que Escalam com Você
        </h1>
        <p className="mt-4 text-sm md:text-base text-zinc-500">
          Escolha o plano ideal para desbloquear ferramentas poderosas e insights.
          Preços transparentes construídos para criadores modernos.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid rounded-2xl border border-zinc-200 bg-white shadow-sm md:grid-cols-6 overflow-hidden">
        {/* Free Plan */}
        <div className="flex flex-col justify-between border-b border-zinc-200 p-6 md:col-span-2 md:border-r md:border-b-0 bg-zinc-50/50">
          <div className="space-y-4">
            <div>
              <h2 className="inline-block rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide bg-zinc-200 text-zinc-700">
                Gratuito
              </h2>
              <span className="my-3 block text-4xl font-bold text-zinc-900">
                R$ 0
              </span>
              <p className="text-sm text-zinc-500">
                Ideal para testar e conhecer a plataforma
              </p>
            </div>

            <button 
                onClick={() => handleCheckout('free')}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
            >
                Começar Agora
            </button>

            <div className="my-6 h-px w-full bg-zinc-200" />

            <ul className="space-y-3 text-sm text-zinc-600">
              {[
                '3 Gerações por dia',
                'Exportação HTML Básico',
                'Acesso a modelos padrão',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-zinc-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="z-10 grid gap-8 p-6 md:col-span-4 lg:grid-cols-2 bg-white">
          {/* Pricing + Chart */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Plano Pro Ilimitado</h2>
              <div className="flex items-baseline gap-1">
                  <span className="my-3 block text-4xl font-bold text-blue-600">
                    R$ 49,90
                  </span>
                  <span className="text-zinc-400 font-medium">/mês</span>
              </div>
              <p className="text-sm text-zinc-500">
                Perfeito para profissionais, professores, advogados, estudantes, designer, startups e criadores de conteúdo.
              </p>
            </div>
            <div className="h-48 w-full rounded-lg border border-zinc-100 bg-white p-2 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
              <InterestChart />
            </div>
          </div>
          
          {/* Features */}
          <div className="relative w-full flex flex-col justify-between">
            <div>
                <div className="text-sm font-semibold text-zinc-900">Tudo do Gratuito mais:</div>
                <ul className="mt-4 space-y-3 text-sm text-zinc-600">
                {[
                    'Gerações Ilimitadas',
                    'Exportação React/JSON completa',
                    'Sem marca d\'água',
                    'Histórico de criações ilimitado',
                    'Suporte prioritário 24/7',
                    'Acesso antecipado a novos modelos (Gemini Pro Vision)',
                    'Armazenamento em nuvem seguro',
                    'Licença comercial dos artefatos',
                    'Colaboração em tempo real (Em breve)',
                ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-blue-500" />
                    {item}
                    </li>
                ))}
                </ul>
            </div>

            {/* Call to Action */}
            <div className="mt-8 grid w-full grid-cols-2 gap-3">
              <button
                onClick={() => handleCheckout('pro')}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Assinar Agora
              </button>
              <button 
                onClick={() => handleCheckout('free')}
                className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Teste Grátis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterestChart() {
  const chartData = [
    { month: 'Jan', interest: 120 },
    { month: 'Fev', interest: 180 },
    { month: 'Mar', interest: 250 },
    { month: 'Abr', interest: 210 },
    { month: 'Mai', interest: 280 },
    { month: 'Jun', interest: 320 },
    { month: 'Jul', interest: 350 },
    { month: 'Ago', interest: 380 },
    { month: 'Set', interest: 420 },
    { month: 'Out', interest: 460 },
    { month: 'Nov', interest: 510 }, 
    { month: 'Dez', interest: 600 }, 
  ];

  return (
    <div className="flex flex-col h-full w-full relative z-10">
        <div className="mb-2 px-2 flex items-center justify-between">
            <div>
                <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <RocketLaunchIcon className="w-3.5 h-3.5 text-blue-600" />
                    Produtividade
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium">Crescimento de usuários</p>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 shadow-sm">
                <span>+400%</span>
            </div>
        </div>
        <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#e4e4e7" strokeDasharray="4 4" />
                    <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fontSize: 10, fill: '#71717a' }}
                        interval={2}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        cursor={{ fill: '#f4f4f5' }}
                    />
                    <Bar
                        dataKey="interest"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
}
