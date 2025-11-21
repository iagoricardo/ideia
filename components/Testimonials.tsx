
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from "react";
import { motion } from "framer-motion";

// Dados dos depoimentos simulados para o contexto do Ainlo
const testimonials = [
  {
    text: "Transformou um rascunho de guardanapo em um app funcional em segundos. A precisão da IA é assustadora de tão boa.",
    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Ricardo Souza",
    role: "Product Designer",
  },
  {
    text: "Como desenvolvedor, eu estava cético. Mas o código gerado é limpo, semântico e usa Tailwind perfeitamente. Economizei dias.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Ana Clara",
    role: "Engenheira de Software",
  },
  {
    text: "A capacidade de gamificar diagramas estáticos mudou minhas aulas. Meus alunos agora interagem com o conteúdo.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Marcos Paulo",
    role: "Professor Universitário",
  },
  {
    text: "Validar ideias de startup nunca foi tão rápido. Criei 3 MVPs em uma tarde apenas desenhando telas no papel.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Felipe Costa",
    role: "Fundador de Startup",
  },
  {
    text: "O reconhecimento de texto manuscrito é o melhor que já vi. Ele entendeu minha letra cursiva horrível perfeitamente.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Júlia Mendes",
    role: "Arquiteta",
  },
  {
    text: "Não preciso mais esperar o time de design para testar fluxos. Eu mesmo desenho e o Ainlo faz o resto.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Lucas Oliveira",
    role: "Gerente de Produto",
  },
    {
    text: "A interface é linda e super intuitiva. O fato de poder editar o código depois é um diferencial enorme.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Camila Rocha",
    role: "UX Designer",
  },
  {
    text: "Uso para criar calculadoras personalizadas para meus clientes de consultoria financeira. Impressionante.",
    image: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Roberto Dias",
    role: "Consultor Financeiro",
  },
  {
    text: "Simplesmente a ferramenta de IA mais útil para web que surgiu este ano. O plano Pro vale cada centavo.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80",
    name: "Beatriz Lima",
    role: "Freelancer",
  },
];

// Divisão dos depoimentos em colunas
const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

// Componente individual da coluna de depoimentos
export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {/* Duplicamos o conteúdo para criar o efeito de loop infinito */}
        {[...new Array(2)].fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div 
                className="p-6 rounded-3xl border border-zinc-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full max-w-xs" 
                key={i}
              >
                <div className="text-zinc-600 leading-relaxed font-medium text-sm md:text-base">
                  "{text}"
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover border border-zinc-100 shadow-sm"
                  />
                  <div className="flex flex-col">
                    <div className="font-bold text-zinc-900 tracking-tight leading-5">{name}</div>
                    <div className="text-xs text-zinc-500 font-medium leading-5 tracking-wide uppercase mt-0.5">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};

// Componente Principal da Seção
export const TestimonialsSection = () => {
  return (
    <section className="bg-transparent py-16 sm:py-24 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="flex justify-center">
             <div className="bg-white/60 backdrop-blur-sm border border-zinc-200 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-6 shadow-sm">
                Comunidade
             </div>
        </div>
        <h2 className="text-center text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-6">
          O que estão dizendo
        </h2>
        <p className="text-center text-base md:text-lg text-zinc-600 max-w-2xl mx-auto mb-16">
          Junte-se a milhares de criadores, desenvolvedores e inovadores que já estão dando vida às suas ideias com o Ainlo.
        </p>
        
        {/* Grid de Colunas com Máscara de Gradiente para suavizar o topo e a base */}
        <div className="flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[738px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
};
