
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ VITE_GEMINI_API_KEY is missing in your .env file!");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateTaskBreakdown = async (mainTask: string) => {
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `請將以下學術任務拆解為 5 個可執行的子任務。請使用繁體中文，且「嚴禁使用任何 Markdown 格式」（如 **、###、* 等）。請直接輸出純文字列表： "${mainTask}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating breakdown:", error);
    return null;
  }
};

export const chatWithAssistant = async (message: string, history: {role: 'user' | 'bot', text: string}[]) => {
  if (!ai) return { text: "AI 助手目前尚未配置 API Key，請檢查環境變數設定。" };
  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const contents = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: contents,
      config: {
        systemInstruction: `你是 FOCUS AI，一個極度專業且友善的學術與生活平衡助手。
現在時間是：${dateStr} ${timeStr}。
請務必使用『繁體中文』回覆。
關鍵指令：『嚴禁使用任何 Markdown 語法』，包括但不限於加粗（**）、標題（###）、條列（- 或 *）。
請僅使用純文字與換行來組織對話內容。

    你的核心任務：
    1. 目標具體化：將使用者提供的大目標拆解為具體、可執行的子任務。若提供時間範圍，請合理分配進入行程。
    2. 日常時間分析：深入分析使用者的起床、睡覺、睡眠需求、平日通勤、出門與到家時間。找出使用者一天中的黃金時段。
    3. 給予個人化建議：必須根據使用者的睡眠充足度、通勤負擔等給予具體建議（例如：若睡眠不足建議調整行程）。
    4. 任務重要度排序（艾森豪矩陣）：根據任務的「重要性」與「緊急度」進行數位評分（1-5）。
    5. 格式規範：『嚴禁使用 Markdown』。僅使用純文字與換行。`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "AI 的回覆，應包含詳細分析與給使用者的生活建議" },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "行程標題" },
                  startTime: { type: Type.STRING, description: "開始時間 (HH:mm)" },
                  endTime: { type: Type.STRING, description: "結束時間 (HH:mm)" },
                  date: { type: Type.STRING, description: "日期 (YYYY-MM-DD)" }
                },
                required: ["title", "startTime", "endTime", "date"]
              }
            },
            matrixData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "任務名稱" },
                  importance: { type: Type.NUMBER, description: "重要性評分 (1-5)" },
                  urgency: { type: Type.NUMBER, description: "緊急度評分 (1-5)" }
                },
                required: ["title", "importance", "urgency"]
              }
            }
          },
          required: ["text"]
        }
      }
    });
    
    const result = JSON.parse(response.text);
    if (result.text) result.text = result.text.replace(/\*\*|###|#/g, '');
    return result;
  } catch (error) {
    console.error("Error chatting with assistant:", error);
    return { text: "抱歉，我現在連線有點問題。請稍後再試！" };
  }
};
