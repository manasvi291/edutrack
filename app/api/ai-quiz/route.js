import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { moduleTitle, moduleDescription } = await request.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google API key is missing' }, { status: 500 });
    }

    const aiPrompt = `You are an expert tutor. Create a short quiz (3 multiple-choice questions) to test a student's knowledge after they have studied the module: "${moduleTitle}".
Module Description: "${moduleDescription}"

Return the response ONLY as a valid JSON object with the following structure, without any extra markdown formatting or code blocks:
{
  "questions": [
    {
      "id": 1,
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    }
  ]
}
Each question should have exactly 4 options. "correctAnswer" is the index (0-3) of the correct option.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: aiPrompt }] }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to generate quiz' }, { status: response.status });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const quiz = JSON.parse(cleanText);

    return NextResponse.json({ quiz });

  } catch (error) {
    console.error('Quiz Generation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
