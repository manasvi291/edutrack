import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Google API key is missing' }, { status: 500 });
    }

    const aiPrompt = `You are an expert curriculum designer. The user wants to learn about: "${prompt}".
Create a comprehensive study plan or syllabus for them. 
Return the response ONLY as a valid JSON object with the following structure, without any extra markdown formatting or code blocks:
{
  "topic": "The refined topic name based on the user's prompt",
  "modules": [
    {
      "id": 1,
      "title": "Module Title",
      "description": "A 1-2 sentence compelling hook describing what the learner will build or achieve.",
      "searchKeywords": "Highly specific youtube search string to find a tutorial about this module (e.g. 'React hooks tutorial for beginners')",
      "duration": "Estimated duration (e.g., '2 hours')",
      "lessons": Number of lessons (integer)
    }
  ],
  "totalDuration": "Total estimated duration (e.g., '27 hours')"
}
Make sure it has at least 3-5 modules.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: aiPrompt }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Gemini API Error:', data);
        return NextResponse.json({ error: 'Failed to generate course', details: data }, { status: response.status });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Clean markdown formatting if present
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    const syllabus = JSON.parse(cleanText);

    return NextResponse.json({ syllabus });

  } catch (error) {
    console.error('AI Path Generation Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
