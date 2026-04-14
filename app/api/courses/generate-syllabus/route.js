import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();
    await dbConnect();

    const course = await Course.findOne({ _id: id, user: auth.user.userId });
    if (!course) return NextResponse.json({ message: 'Course not found' }, { status: 404 });

    const apiKey = process.env.GEMINI_API_KEY;
    const prompt = `Create a detailed learning curriculum for a course titled: "${course.title}". 
    The curriculum should be structured in JSON format as follows:
    {
      "topic": "${course.title}",
      "modules": [
        {
          "title": "Module Name",
          "description": "Short description",
          "subModules": [
            { "title": "Lesson 1", "description": "Lesson content summary" },
            { "title": "Lesson 2", "description": "Lesson content summary" }
          ]
        }
      ]
    }
    Make sure it has 4-6 modules, each with 2-4 sub-modules. Return ONLY the JSON.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    const result = await response.json();
    const textData = result.candidates[0].content.parts[0].text;
    const syllabus = JSON.parse(textData);

    const updatedModules = syllabus.modules.map(m => ({
      ...m,
      completed: false,
      subModules: m.subModules.map(sm => ({ ...sm, completed: false }))
    }));

    course.modules = updatedModules;
    await course.save();

    return NextResponse.json({ success: true, course });

  } catch (error) {
    console.error('Syllabus gen error:', error);
    return NextResponse.json({ message: 'Failed to generate roadmap' }, { status: 500 });
  }
}
