import { ai } from './ai';
import { Storage, Message } from './storage';

export interface OrchestrationResult {
  content: string;
  toolUsed: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  codeSnippet?: { language: string; code: string };
  audioUrl?: string;
  createdTask?: any;
  createdMemory?: any;
  calculationResult?: { expression: string; result: string; steps?: string[] };
}

// Deterministic Math Evaluator
export function evaluateMathExpression(expr: string): { expression: string; result: string; steps: string[] } | null {
  try {
    const cleaned = expr.trim();
    // Check if it looks like a math/conversion request
    // Support common math operations: +, -, *, /, %, ^, sqrt, sin, cos, tan, log, percentages, unit conversions
    // Basic safe evaluator for arithmetic
    const sanitized = cleaned
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**');

    // Quick regex check for dangerous patterns
    if (/[a-zA-Z_$]/.test(sanitized.replace(/(Math\.(sqrt|pow|sin|cos|tan|abs|round|floor|ceil|PI|E|log|log10)|sqrt|pi|deg|rad)/gi, ''))) {
      return null;
    }

    const func = new Function(`
      const sqrt = Math.sqrt;
      const pow = Math.pow;
      const sin = (x) => Math.sin(x * Math.PI / 180);
      const cos = (x) => Math.cos(x * Math.PI / 180);
      const tan = (x) => Math.tan(x * Math.PI / 180);
      const abs = Math.abs;
      const pi = Math.PI;
      const log = Math.log10;
      const ln = Math.log;
      return (${sanitized});
    `);

    const val = func();
    if (typeof val === 'number' && !isNaN(val)) {
      return {
        expression: cleaned,
        result: Number.isInteger(val) ? val.toString() : val.toFixed(6).replace(/\.?0+$/, ''),
        steps: [
          `Parsed expression: ${cleaned}`,
          `Evaluated deterministically using IEEE 754 precision math engine`,
          `Result = ${val}`,
        ],
      };
    }
  } catch (err) {
    // Not purely deterministic math or parse error
  }
  return null;
}

export async function orchestrateUserQuery(options: {
  prompt: string;
  history?: Message[];
  forceTool?: string;
  images?: string[];
  docContext?: string;
}): Promise<OrchestrationResult> {
  const { prompt, history = [], forceTool, images = [], docContext } = options;
  const settings = Storage.getSettings();
  const memories = Storage.getActiveMemories();

  // 1. Check for Task / Reminder creation intent
  const reminderMatch = prompt.match(/(?:remind me (?:to|that)?|create (?:a )?task (?:to)?|add (?:a )?task|todo:?)\s*(.+)/i);
  if (reminderMatch && !forceTool) {
    const taskText = reminderMatch[1].trim();
    let dueDate: string | undefined;
    if (/tomorrow/i.test(prompt)) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDate = d.toISOString().split('T')[0];
    } else if (/today|tonight/i.test(prompt)) {
      dueDate = new Date().toISOString().split('T')[0];
    } else if (/next week/i.test(prompt)) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dueDate = d.toISOString().split('T')[0];
    }

    const priority = /urgent|important|asap|critical/i.test(prompt) ? 'high' : 'medium';
    const newTask = Storage.addTask(taskText, priority, dueDate, `Created via voice/chat: "${prompt}"`);

    return {
      content: `I've created a new task for you:\n\n**${taskText}**\n${dueDate ? `• **Due Date:** ${dueDate}\n` : ''}• **Priority:** ${priority.toUpperCase()}\n\nYou can view and manage all your tasks in the Tasks & Reminders manager panel.`,
      toolUsed: 'tasks',
      createdTask: newTask,
    };
  }

  // 2. Check for Memory storage intent
  const memoryMatch = prompt.match(/(?:remember that|note that|keep in mind that|save to memory:?)\s*(.+)/i);
  if (memoryMatch && !forceTool) {
    const memContent = memoryMatch[1].trim();
    const newMem = Storage.addMemory('preference', memContent);
    return {
      content: `I have saved this to my long-term memory:\n\n> *"${memContent}"*\n\nI will remember this preference across all our conversations. You can view, toggle, or edit your memories anytime in the Memory manager.`,
      toolUsed: 'memory',
      createdMemory: newMem,
    };
  }

  // 3. Check for pure Calculator tool intent or math expressions
  const isCalcQuery = forceTool === 'calculator' || /^calc(ulate)?:\s*(.+)/i.test(prompt) || /^(what is|\s*)\s*([\d\s\+\-\*\/\^\(\)\.%,sqrt|sin|cos|tan|log]+)(\s*\?|\s*)$/i.test(prompt);
  if (isCalcQuery && !images.length) {
    const exprMatch = prompt.replace(/^(what is|calculate|solve|calc:?)\s*/i, '').replace(/\?$/, '').trim();
    const mathResult = evaluateMathExpression(exprMatch);
    if (mathResult) {
      return {
        content: `**Calculation Result:**\n\n$$\\mathbf{${mathResult.expression} = ${mathResult.result}}$$\n\n*Deterministic calculation evaluated without LLM approximation.*`,
        toolUsed: 'calculator',
        calculationResult: mathResult,
      };
    }
  }

  // 4. Determine AI System Instruction with memory context
  const memoryContext = memories.length > 0
    ? `\n\nUSER LONG-TERM MEMORY & PREFERENCES:\n${memories.join('\n')}`
    : '';

  const personaInstructions: Record<string, string> = {
    helpful: 'Be friendly, insightful, articulate, well-structured, and comprehensive.',
    expert: 'Provide deep, rigorous, technically authoritative insights with structured breakdowns.',
    concise: 'Be direct, crisp, and high-signal with minimal fluff while answering fully.',
    creative: 'Be imaginative, evocative, eloquent, and engaging.',
    technical: 'Focus on engineering precision, architecture, code quality, edge cases, and best practices.',
  };

  const systemInstruction = `You are Aether AI, an advanced All-in-One Personal AI Assistant and unified intelligent workspace.
User Name: ${settings.userName}
Current Response Style: ${settings.persona} (${personaInstructions[settings.persona] || ''})
User Language: ${settings.language}
Custom Directives: ${settings.customInstructions || 'None'}
${memoryContext}

Guidelines:
1. Always format responses using clean Markdown (headings, lists, bold highlights, code blocks with language identifiers, tables when appropriate).
2. When answering factual or current events questions, provide crisp explanations and acknowledge verified facts.
3. If code is generated, ensure it is production-ready, clean, well-commented, and includes appropriate error handling.
4. When analyzing documents or images, point out key takeaways and concrete data points.
5. If deterministic calculations or tasks are mentioned, mention the corresponding tool action.`;

  // 5. Check if Web Search Grounding is needed
  const isSearchNeeded =
    forceTool === 'search' ||
    (settings.autoWebSearch &&
      (/(?:latest|current|recent|today|news|weather|price|stock|released in 202[4-6]|score|who won|election|update|real-time)/i.test(prompt) ||
        forceTool === 'search'));

  // 6. Handle Multimodal / Images
  const contentsParts: any[] = [];

  if (images.length > 0) {
    for (const img of images) {
      const match = img.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        contentsParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
  }

  // Add document RAG context if present
  let augmentedPrompt = prompt;
  if (docContext) {
    augmentedPrompt = `[RELEVANT RETRIEVED DOCUMENT CONTEXT]:\n${docContext}\n\n[USER INQUIRY]:\n${prompt}`;
  }

  contentsParts.push({ text: augmentedPrompt });

  // 7. Call Gemini Model
  try {
    if (isSearchNeeded && images.length === 0) {
      // Use Gemini 3.8 Flash with Google Search Grounding
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsParts,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || 'I analyzed the query, but no text output was produced.';
      const candidate = response.candidates?.[0];
      const grounding = candidate?.groundingMetadata;

      const sources: Array<{ title: string; url: string; snippet?: string }> = [];
      if (grounding?.groundingChunks) {
        for (const chunk of grounding.groundingChunks) {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || new URL(chunk.web.uri).hostname,
              url: chunk.web.uri,
            });
          }
        }
      }

      return {
        content: text,
        toolUsed: 'search',
        sources: sources.length ? sources : undefined,
      };
    }

    // Standard Gemini 3.8 Flash execution
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contentsParts,
      config: {
        systemInstruction,
      },
    });

    const text = response.text || 'No response generated.';

    // Check if response contains code snippets
    let codeSnippet: { language: string; code: string } | undefined;
    const codeMatch = text.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
    if (codeMatch) {
      codeSnippet = {
        language: codeMatch[1] || 'text',
        code: codeMatch[2].trim(),
      };
    }

    return {
      content: text,
      toolUsed: images.length > 0 ? 'image' : docContext ? 'document' : codeSnippet ? 'code' : 'chat',
      codeSnippet,
    };
  } catch (error: any) {
    console.error('Gemini Orchestration error:', error);
    return {
      content: `I encountered an issue processing your request: ${error.message || 'Please check your connection and API configuration.'}`,
      toolUsed: 'error',
    };
  }
}
