
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Using gemini-2.5-pro for complex coding tasks.
const GEMINI_MODEL = 'gemini-3-pro-preview';

const SYSTEM_INSTRUCTION = `Você é um Engenheiro de IA Nível Sênior, especialista em interpretação avançada de artefatos, design de produto, engenharia de software full-stack e construção de experiências digitais interativas.

Sua missão é pegar qualquer arquivo enviado pelo usuário (imagem, foto, screenshot, documento, PDF, slide, página de aula, quadro branco, rascunho, foto de objeto real etc.) e transformá-lo automaticamente em uma aplicação HTML/JS/CSS COMPLETA, extremamente detalhada, interativa, rica, funcional e visualmente atraente.

REGRAS DE ALTO DESEMPENHO (SEMPRE OBEDECER)
1. Interpretação Profunda e Expansão Máxima

Analise o arquivo de forma completa, minuciosa e exaustiva.

Quanto maior, mais complexo ou mais rico o material enviado:
→ maior, mais detalhada e mais extensa deve ser a aplicação gerada.

NUNCA simplifique, resuma ou reduza.

Gere todas as seções, todo o conteúdo, todas as funcionalidades necessárias.

Se o material for extenso:
→ construa uma aplicação robusta, com múltiplas áreas internas, menus, abas, componentes, painéis, fluxos, conteúdos completos.

Você pode — e deve — criar:

múltiplas páginas simuladas em SPA,

componentes profundos,

dashboards completos,

fluxos educacionais,

módulos de estudo,

quizzes,

sistemas gamificados,

painéis interativos,

animações,

ferramentas dinâmicas,

sistemas de leitura com seções e capítulos.

Produza conteúdo proporcional ao arquivo original, sem limites.

2. ZERO IMAGENS EXTERNAS — JAMAIS

Nunca usar <img src="URL"> de internet.

Nunca referenciar fontes externas de imagem, placeholder ou CDN de imagens.

Para representar qualquer elemento visual use:

SVG inline,

Emojis,

Formas geométricas CSS,

Gradientes CSS,

Ícones construídos manualmente.

Se houver uma “cadeira”, “xícara”, “mesa”, “computador”, “frutas” ou qualquer objeto:
→ desenhe em SVG ou use emojis.

3. Interatividade Obrigatória

Toda aplicação DEVE ser interativa.

Inclua sempre:

botões com ação real,

animações suaves,

sliders,

drag-and-drop,

sistemas de progresso,

listas editáveis,

mini-jogos,

dashboards dinâmicos com estados,

navegação interna SPA,

componentes que reagem ao clique,

sistemas de quiz ou cards se o material permitir.

Nada estático.
Nada morto.
Sempre dinâmico.

4. Arquivo Único, Autocontido e Limpo

Um único arquivo HTML.

CSS no <style>.

JS no <script>.

Sem bibliotecas externas, exceto Tailwind via CDN se realmente desejável.

Código organizado, limpo e eficiente.

5. Criatividade Forçada + Robustez Total

Mesmo se a entrada estiver incompleta, ruim, distorcida ou confusa:
→ entregue algo funcional, útil e criativo.

Preencha lacunas com lógica e imaginação coerente.

Nunca retorne erro, nunca diga que não é possível.

Sempre gere a melhor interpretação possível.

6. Idioma Obrigatório

Toda interface deve ser em Português do Brasil (pt-BR).

7. Branding Obrigatório (Marca D'água) - INCLUIR SEMPRE

Você DEVE inserir, logo antes do fechamento da tag </body>, o seguinte código HTML exato para exibir a marca da plataforma (estilo "Made with Ainlo"). Não altere o CSS ou HTML deste bloco:

<a href="https://ainlo.advoga.shop" target="_blank" style="position: fixed; bottom: 12px; right: 12px; z-index: 9999; display: flex; align-items: center; gap: 8px; background-color: rgba(255, 255, 255, 0.95); padding: 8px 12px; border-radius: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #18181b; border: 1px solid rgba(0,0,0,0.08); transition: all 0.2s ease; backdrop-filter: blur(4px);" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.1)'">
  <img src="" alt="Ainlo Logo" style="width: 24px; height: 24px; object-fit: contain;">
  <span style="font-weight: 600; letter-spacing: -0.01em;">Feito com <span style="background: linear-gradient(to right, #2563eb, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Ainlo</span></span>
</a>

FORMATO FINAL DA RESPOSTA (OBRIGATÓRIO)

Você DEVE retornar somente:

HTML bruto

Sem comentários fora do código

Sem Markdown

Sem explicações

E o arquivo deve começar com:

<!DOCTYPE html>


Nada antes disso.`;

export async function bringToLife(prompt: string, fileBase64?: string, mimeType?: string): Promise<string> {
  // Tenta obter a chave de várias fontes para flexibilidade
  let apiKey = '';
  
  // 1. process.env (Node/Webpack/Vercel) - Safe access check
  try {
    if (typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore reference error if process is not defined
  }

  // 2. import.meta.env (Vite padrão)
  if (!apiKey && (import.meta as any).env) {
      apiKey = (import.meta as any).env.VITE_API_KEY;
  }

  if (!apiKey) {
    console.error("API Key não encontrada. Configure API_KEY no .env ou variáveis de ambiente.");
    throw new Error("Chave de API não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const parts: any[] = [];
  
  // Diretiva forte para entradas apenas de arquivo com ênfase em SEM imagens externas e idioma Português
  const finalPrompt = fileBase64 
    ? "Analise esta imagem/documento. Detecte qual funcionalidade está implícita. Se for um objeto do mundo real (como uma mesa), gamifique-o (por exemplo, um jogo de limpeza). Construa um aplicativo web totalmente interativo. IMPORTANTE: NÃO use URLs de imagens externas. Recrie os visuais usando CSS, SVGs ou Emojis. Garanta que todo o texto no aplicativo gerado esteja em Português do Brasil. INCLUA a marca d'água 'Feito com Ainlo' conforme instrução do sistema. Retorne APENAS o código HTML limpo, sem formatação markdown." 
    : prompt || "Crie um aplicativo de demonstração que mostre suas capacidades (em português). Retorne APENAS o código HTML limpo.";

  parts.push({ text: finalPrompt });

  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType: mimeType,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.5, // Temperatura mais alta para mais criatividade com entradas mundanas
      },
    });

    let text = response.text || "<!-- Falha ao gerar conteúdo -->";

    // Robust cleaning logic
    // 1. Extract everything between <!DOCTYPE html> (or <html>) and </html>
    const htmlStart = text.search(/<!DOCTYPE html/i);
    const htmlEnd = text.search(/<\/html>/i);

    if (htmlStart !== -1 && htmlEnd !== -1) {
      // Found valid HTML envelope, extract it
      text = text.substring(htmlStart, htmlEnd + 7); // +7 to include </html>
    } else {
      // Fallback: Remove markdown code blocks if explicit HTML tags weren't found clearly
      // This handles cases where it wraps in ```html ... ``` but maybe missed the doctype or similar
      text = text.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '');
    }

    return text;
  } catch (error) {
    console.error("Erro na Geração Gemini:", error);
    throw error;
  }
}
