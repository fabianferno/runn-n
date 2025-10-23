import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { imageData, criteria, questId } = await request.json();

    if (!imageData || !criteria) {
      return NextResponse.json(
        { error: 'Image data and criteria are required' },
        { status: 400 }
      );
    }

    // Convert base64 data URL to base64 string
    const base64Image = imageData.split(',')[1];

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Using the latest model
      messages: [
        {
          role: "system",
          content: "You are an image analysis assistant. You must respond with ONLY a single word: 'yes' or 'no'. Do not provide any explanation, confidence scores, or additional text. Just answer 'yes' if the image meets the condition, or 'no' if it doesn't.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Does this image satisfy this condition: ${criteria}? Answer only 'yes' or 'no'.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 10,
    });

    const analysisResult = response.choices[0].message?.content?.trim().toLowerCase();
    
    if (!analysisResult) {
      throw new Error('No analysis result received');
    }

    // Parse the binary response
    const verified = analysisResult === 'yes';

    return NextResponse.json({
      success: true,
      questId,
      verified,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
