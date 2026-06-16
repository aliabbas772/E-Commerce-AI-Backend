import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY as string
)

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

export const getOutfitRecommendation = async (
  occasion: string,
  budget: number,
  gender: string
): Promise<string> => {
  const prompt = `You are a fashion expert for an Indian clothing ecommerce store.

A customer is looking for outfit recommendations.
Occasion: ${occasion}
Budget: ₹${budget}
Gender: ${gender}

Suggest a complete outfit with:
1. Main clothing item
2. Bottom wear if needed
3. Accessories if any
4. Style tips

Keep it practical, within budget, and relevant to Indian fashion. Be concise.`

  const result = await model.generateContent(prompt)
  const response = result.response.text()
  return response
}

export const getSizeRecommendation = async (
  height: number,
  weight: number,
  gender: string,
  category: string
): Promise<string> => {
  const prompt = `You are a sizing expert for an Indian clothing store.

Customer details:
Height: ${height} cm
Weight: ${weight} kg
Gender: ${gender}
Category: ${category}

Recommend the right size (XS/S/M/L/XL/XXL) with brief explanation. Also mention fit preference (slim/regular/relaxed). Be concise and direct.`

  const result = await model.generateContent(prompt)
  const response = result.response.text()
  return response
}