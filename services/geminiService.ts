
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const API_KEY = process.env.API_KEY || '';

export const analyzeForm = async (base64Image: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `あなたはスポーツ科学に深い造詣を持つプロの陸上競技・ランニングコーチです。
ユーザーから提供されたフォーム画像を解剖学的・力学的な視点で分析し、具体的な改善アドバイスと、その弱点を克服するための練習メニュー（ドリル）を提案してください。

【制約事項】
1. 返信は必ず以下のJSON形式で行ってください：
{
  "advice": "フォームの改善点に関する詳細なアドバイス",
  "training": "おすすめの練習メニューとドリル"
}
2. 「advice」と「training」の内容は、それぞれ200文字程度で詳細に記述してください。
3. 初心者にも分かりやすく、かつプロならではの鋭い視点（接地位置、体幹の傾き、腕振りの軌道など）を含めてください。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: "このフォームを詳細に分析してください。アドバイスと練習メニューをそれぞれ200文字程度のボリュームで、JSON形式で回答してください。" }
      ]
    },
    config: {
      systemInstruction,
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          advice: { type: Type.STRING, description: "フォーム改善のアドバイス（約200文字）" },
          training: { type: Type.STRING, description: "練習メニューの提案（約200文字）" }
        },
        required: ["advice", "training"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("応答が空です");
    return JSON.parse(text) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
    throw new Error("AIからの応答を解析できませんでした。もう一度お試しください。");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const cleanText = text.replace(/[#*`]/g, '');

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `以下の分析結果を、アスリートに優しく語りかけるように読み上げてください：\n\n${cleanText}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("音声データの生成に失敗しました。");
  return base64Audio;
};

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
