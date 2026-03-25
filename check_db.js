
import dbConnect from './lib/dbConnect.js';
import Course from './models/Course.js';
import mongoose from 'mongoose';

async function checkDb() {
  await dbConnect();
  const courses = await Course.find();
  console.log('TOTAL COURSES:', courses.length);
  console.log('FIRST COURSE USER:', courses[0]?.user);
  process.exit();
}

checkDb();
