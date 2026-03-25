import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = authenticateRequest(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const courses = await Course.find({ user: auth.user.userId });

    const enrolled = courses.length;
    const completed = courses.filter(
      (course) => course.status === 'completed'
    ).length;
    const inProgress = courses.filter(
      (course) => course.status === 'ongoing'
    ).length;

    return NextResponse.json({
      enrolled,
      completed,
      inProgress,
      certificates: completed
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { message: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
