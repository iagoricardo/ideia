import React from 'react';
import { CheckCircleIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

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
                R$ 0,00
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
            
            {/* New Chart Component Matching Screenshot Style */}
            <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                <div className="mb-4">
                    <h3 className="font-bold text-zinc-900 text-sm">Produtividade</h3>
                    <p className="text-xs text-zinc-500">Crescimento de usuários</p>
                </div>
                <div className="h-32 w-full relative">
                    <LineChart />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 mt-2 px-2 font-medium">
                    <span>Fev</span>
                    <span>Abr</span>
                    <span>Jun</span>
                    <span>Ago</span>
                    <span>Out</span>
                    <span>Dez</span>
                </div>
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

// Clean Line Chart SVG Component
function LineChart() {
  // Smooth curve data points
  const points = [
      [0, 80], [20, 75], [40, 78], [60, 65], [80, 55], [100, 50], 
      [120, 45], [140, 40], [160, 35], [180, 20], [200, 10]
  ];
  
  // Normalize points to SVG path string
  // M x y Q cx cy x y (Quadratic Bezier for smoothness)
  const pathD = `
    M ${points[0][0]} ${points[0][1]} 
    C 30 80, 50 60, 70 65
    S 120 50, 140 45
    S 180 30, 200 10
  `;

  return (
    <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100" preserveAspectRatio="none">
        {/* Background Grid Lines */}
        <line x1="0" y1="25" x2="200" y2="25" stroke="#f4f4f5" strokeWidth="1" />
        <line x1="0" y1="50" x2="200" y2="50" stroke="#f4f4f5" strokeWidth="1" />
        <line x1="0" y1="75" x2="200" y2="75" stroke="#f4f4f5" strokeWidth="1" />

        {/* Animated Path */}
        <motion.path 
            d={pathD}
            fill="none"
            stroke="#f59e0b" // Amber-500/Yellowish Orange like screenshot
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        {/* End Dot */}
        <motion.circle 
            cx="200" 
            cy="10" 
            r="4" 
            fill="#f59e0b" 
            stroke="white" 
            strokeWidth="2"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 2, duration: 0.3 }}
        />
    </svg>
  );
}