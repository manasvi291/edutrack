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
    let modulesCompleted = 0;
    let coursesCompleted = 0;

    courses.forEach(course => {
      if (course.status === 'completed') coursesCompleted++;
      if (course.modules) {
        modulesCompleted += course.modules.filter(m => m.completed).length;
      }
    });

    const inProgress = courses.filter((course) => course.status === 'ongoing').length;

    const User = (await import('@/models/User')).default;
    let userData = await User.findById(auth.user.userId);

    // Initial user stats if not set
    if (!userData.weeklyActivity || userData.weeklyActivity.length === 0) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      userData.weeklyActivity = days.map(d => ({ day: d, xp: 0 }));
    }

    return NextResponse.json({
      enrolled,
      completed: modulesCompleted,
      inProgress,
      certificates: coursesCompleted,
      totalXP: userData.totalXP || 0,
      streak: userData.streak || 0,
      weeklyActivity: userData.weeklyActivity,
      userName: userData.name
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { message: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
