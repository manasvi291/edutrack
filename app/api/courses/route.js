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

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id, user: auth.user.userId },
      updateData,
      { new: true }
    );

    if (!updatedCourse) return NextResponse.json({ message: 'Course not found' }, { status: 404 });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    return NextResponse.json({ message: 'Update failed' }, { status: 500 });
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
