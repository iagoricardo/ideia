
import React from "react";
import { cn } from "../lib/utils";
import {
  CodeBracketIcon,
  CpuChipIcon,
  CubeTransparentIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  BoltIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export function FeaturesSection() {
  const features = [
    {
      title: "Visão Computacional",
      description:
        "Nossa IA enxerga além do pixel. Entendemos rascunhos, diagramas técnicos e anotações à mão com precisão cirúrgica.",
      icon: <EyeIcon className="w-8 h-8 stroke-1" />,
    },
    {
      title: "Código Limpo",
      description:
        "Geração automática de HTML5 semântico e Tailwind CSS. Nada de código espaguete, apenas engenharia sólida.",
      icon: <CodeBracketIcon className="w-8 h-8 stroke-1" />,
    },
    {
      title: "Gamificação Instantânea",
      description:
        "Transformamos conteúdo estático em experiências jogáveis. De quizzes a simulações interativas em segundos.",
      icon: <SparklesIcon className="w-8 h-8 stroke-1" />,
    },
    {
      title: "Totalmente Responsivo",
      description:
        "Interfaces fluidas que funcionam perfeitamente em celulares, tablets e desktops desde o primeiro momento.",
      icon: <DevicePhoneMobileIcon className="w-8 h-8 stroke-1" />,
    },
    {
      title: "Zero Configuração",
      description:
        "Não precisa instalar nada. O código gerado é autocontido em um único arquivo pronto para rodar.",
      icon: <CubeTransparentIcon className="w-8 h-8 stroke-1" />,
    },
    {
      title: "Preview em Tempo Real",
      description:
        "Assista à mágica acontecer. Visualize a construção da interface elemento por elemento enquanto a IA trabalha.",
      icon: <BoltIcon className="w-8 h-8 stroke-1" />,
    },
    {
      title: "Exportação Livre",
      description:
        "Seu código é seu. Exporte o projeto completo em JSON ou HTML e hospede onde quiser, sem lock-in.",
      icon: <ArrowDownTrayIcon className="w-8 h-8 stroke-1" />,
    },
    {
      title: "Inteligência Gemini",
      description:
        "Impulsionado pelos modelos multimodais mais avançados do Google, capazes de raciocínio complexo.",
      icon: <CpuChipIcon className="w-8 h-8 stroke-1" />,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
       <div className="text-center mb-12 relative z-20">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Poder Ilimitado
          </h2>
          <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
            Tudo o que você precisa para transformar ideias em realidade.
          </p>
       </div>
       
       {/* Enhanced Container: Higher opacity (90%) and heavy blur to block background particles */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-20 border border-zinc-200 bg-white/90 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl ring-1 ring-zinc-900/5">
          {features.map((feature, index) => (
            <Feature 
              key={feature.title} 
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              index={index} 
            />
          ))}
       </div>
    </div>
  );
}

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}

const Feature: React.FC<FeatureProps> = ({
  title,
  description,
  icon,
  index,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col border-r border-b border-zinc-100 py-8 px-6 relative group/feature transition-all duration-300 bg-transparent hover:bg-white/50",
        (index === 0 || index === 4) && "lg:border-l-0",
        index < 4 && "lg:border-b border-zinc-100"
      )}
    >
      {/* Gradient Hover Effect */}
      <div className="opacity-0 group-hover/feature:opacity-100 transition duration-500 absolute inset-0 h-full w-full bg-gradient-to-br from-blue-50 to-purple-50 pointer-events-none" />
      
      <div className="mb-6 relative z-10 text-zinc-400 group-hover/feature:text-blue-600 transition-colors duration-300 transform group-hover/feature:scale-110 origin-left">
        {icon}
      </div>
      
      <div className="text-lg font-bold mb-3 relative z-10 flex items-center">
        <div className="absolute -left-6 top-1.5 h-5 w-1 rounded-r-full bg-zinc-200 group-hover/feature:bg-blue-600 group-hover/feature:h-6 transition-all duration-300"></div>
        <span className="text-zinc-800 transition-transform duration-300 group-hover/feature:translate-x-1">
          {title}
        </span>
      </div>
      
      <p className="text-sm text-zinc-500 leading-relaxed relative z-10 font-medium">
        {description}
      </p>
    </div>
  );
};
