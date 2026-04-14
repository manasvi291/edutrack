import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/models/Course';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import puppeteer from 'puppeteer';

export async function GET(request) {
  try {
    const auth = authenticateRequest(request);
    
    if (!auth.authenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Fetch Course & User details
    const course = await Course.findOne({ _id: courseId, user: auth.user.userId });
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const user = await User.findById(auth.user.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Design the HTML Certificate template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Certificate of Completion</title>
        <style>
          body {
            background-color: #f1f5f9;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 0;
          }
          .certificate {
            background-color: #ffffff;
            border: 20px solid #4F46E5;
            padding: 50px 80px;
            text-align: center;
            width: 800px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            position: relative;
          }
          .certificate::before {
            content: '';
            position: absolute;
            top: 5px; left: 5px; right: 5px; bottom: 5px;
            border: 2px dashed #4F46E5;
            pointer-events: none;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 40px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          h1 {
            font-size: 48px;
            color: #0F172A;
            margin: 0 0 20px 0;
          }
          .subtitle {
            font-size: 20px;
            color: #64748B;
            margin-bottom: 40px;
          }
          .recipient {
            font-size: 42px;
            font-weight: bold;
            color: #4F46E5;
            margin-bottom: 30px;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 10px;
            display: inline-block;
          }
          .course-text {
            font-size: 24px;
            color: #334155;
            margin-bottom: 10px;
          }
          .course-title {
            font-size: 32px;
            font-weight: bold;
            color: #0F172A;
            margin-bottom: 50px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #E2E8F0;
          }
          .signature {
            text-align: center;
          }
          .signature img {
            height: 50px;
          }
          .signature p {
            margin: 5px 0 0 0;
            font-weight: bold;
            color: #0F172A;
            border-top: 1px solid #0F172A;
            padding-top: 5px;
            width: 200px;
          }
          .date {
            text-align: right;
            color: #64748B;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo">SkillTrack Academy</div>
          <h1>Certificate of Completion</h1>
          <div class="subtitle">This is to proudly certify that</div>
          <div class="recipient">${user.name || 'Dedicated Learner'}</div>
          <div class="course-text">has successfully completed the course</div>
          <div class="course-title">${course.title}</div>
          
          <div class="footer">
            <div class="signature">
              <div style="font-family: 'Brush Script MT', cursive; font-size: 32px; color: #4F46E5; line-height: 1;">SkillTrack Admin</div>
              <p>Platform Director</p>
            </div>
            <div class="date">
              <strong>Granted On:</strong><br/>
              ${new Date(course.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificate_${courseId}.pdf"`
      }
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
