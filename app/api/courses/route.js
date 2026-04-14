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
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const course = await Course.findOne({ _id: id, user: auth.user.userId });
      if (!course) return NextResponse.json({ message: 'Course not found' }, { status: 404 });
      return NextResponse.json(course);
    }

    const courses = await Course.find({ user: auth.user.userId });
    return NextResponse.json(courses);

  } catch (error) {
    console.error('Courses error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = authenticateRequest(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }

    await dbConnect();
    const data = await request.json();
    
    const newCourse = new Course({
      title: data.title,
      category: data.category || 'General',
      progress: data.progress || 0,
      status: data.status || 'ongoing',
      url: data.url || '',
      modules: data.modules || [],
      deadline: data.deadline ? new Date(data.deadline) : null,
      user: auth.user.userId
    });

    
    await newCourse.save();

    return NextResponse.json(newCourse, { status: 201 });

  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { message: 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const data = await request.json();
    const { id, ...updateData } = data;
    
    // Convert deadline string to Date if it exists
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline);
    }

    // --- Progressive XP Logic ---
    const oldCourse = await Course.findOne({ _id: id, user: auth.user.userId });
    
    // Update the course first
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id, user: auth.user.userId },
      updateData,
      { returnDocument: 'after' }
    );

    if (!updatedCourse) return NextResponse.json({ message: 'Course not found' }, { status: 404 });

    // Calculate XP Delta
    let deltaXP = 0;
    if (oldCourse && data.modules) {
      // Calculate old vs new sub-module completions
      const oldSubCount = oldCourse.modules.reduce((acc, m) => acc + (m.subModules?.filter(sm => sm.completed).length || 0), 0);
      const newSubCount = updatedCourse.modules.reduce((acc, m) => acc + (m.subModules?.filter(sm => sm.completed).length || 0), 0);
      
      const subDelta = Math.max(0, newSubCount - oldSubCount);
      deltaXP += subDelta * 10;

      // Calculate old vs new module completions
      const oldModCount = oldCourse.modules.filter(m => m.completed).length;
      const newModCount = updatedCourse.modules.filter(m => m.completed).length;
      
      const modDelta = Math.max(0, newModCount - oldModCount);
      deltaXP += modDelta * 50;

      // Course completion bonus
      if (oldCourse.status !== 'completed' && updatedCourse.status === 'completed') {
        deltaXP += 100;
      }
    }

    // --- Analytics Update ---
    const User = (await import('@/models/User')).default;
    const userDoc = await User.findById(auth.user.userId);
    
    if (userDoc && deltaXP > 0) {
      userDoc.totalXP += deltaXP;

      // Ensure weeklyActivity is initialized
      if (!userDoc.weeklyActivity || userDoc.weeklyActivity.length === 0) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        userDoc.weeklyActivity = days.map(d => ({ day: d, xp: 0 }));
      }

      // Streak logic
      const today = new Date().setHours(0,0,0,0);
      const lastAct = userDoc.lastActivityDate ? new Date(userDoc.lastActivityDate).setHours(0,0,0,0) : null;
      
      if (!lastAct) {
        userDoc.streak = 1;
      } else if (today > lastAct) {
        const diff = (today - lastAct) / (1000 * 60 * 60 * 24);
        if (diff === 1) userDoc.streak += 1;
        else if (diff > 1) userDoc.streak = 1;
      }
      userDoc.lastActivityDate = new Date();

      // Weekly Activity
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const currentDay = dayNames[new Date().getDay()];
      const dayIdx = userDoc.weeklyActivity.findIndex(a => a.day === currentDay);
      if (dayIdx > -1) {
        userDoc.weeklyActivity[dayIdx].xp += deltaXP;
      }

      await userDoc.save();
    }

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ message: 'Update failed', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = authenticateRequest(request);
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const deletedCourse = await Course.findOneAndDelete({ _id: id, user: auth.user.userId });

    if (!deletedCourse) return NextResponse.json({ message: 'Course not found' }, { status: 404 });

    return NextResponse.json({ message: 'Course deleted' });
  } catch (error) {
    return NextResponse.json({ message: 'Delete failed' }, { status: 500 });
  }
}
