import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Parses an image (receipt or screenshot) to extract transaction details.
 */
export const parseReceiptImage = async (base64Image: string): Promise<Omit<Transaction, 'id'>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG/JPEG, API is flexible
              data: base64Image,
            },
          },
          {
            text: `你是一个专业的财务数据录入助手。请分析这张图片（通常是微信支付 WeChat Pay、支付宝 Alipay 账单截图或银行APP截图）。
            
            请提取图中所有可见的交易。
            对于每笔交易，请识别：
            - merchant: 商户名称 (例如：瑞幸咖啡, 滴滴出行)。
            - date: 日期 (格式 YYYY-MM-DD)。
            - amount: 金额 (数字)。
            - type: INCOME (收入) 或 EXPENSE (支出)。
            - category: 基于以下列表选择最匹配的主分类：
              [餐饮食品, 生活日用, 交通出行, 通讯物流, 住房物业, 娱乐社交, 医疗健康, 收入, 其他支出]
            - subCategory: 基于主分类，猜测一个简短的子分类 (例如: 三餐, 奶茶, 打车, 房租)。
            - note: 任何额外的描述信息。
            
            如果图片不是账单，返回空数组。`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              merchant: { type: Type.STRING },
              date: { type: Type.STRING },
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              type: { type: Type.STRING, enum: [TransactionType.EXPENSE, TransactionType.INCOME] },
              note: { type: Type.STRING },
            },
            required: ["date", "amount", "category", "type"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    const data = JSON.parse(text) as Omit<Transaction, 'id'>[];
    return data;
  } catch (error) {
    console.error("Error parsing receipt with Gemini:", error);
    throw new Error("图片解析失败，请确保截图清晰。");
  }
};