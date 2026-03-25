# EduTrack - Next.js Full-Stack Application

Welcome to **EduTrack**, a modern learning management system built with Next.js! This project has been converted from a traditional HTML/CSS/JavaScript + Express.js backend to a full-stack Next.js application.

## 🚀 Features

- ✅ **User Authentication** - Register, login with JWT tokens
- ✅ **Dashboard Analytics** - Real-time course statistics
- ✅ **Course Management** - View and track enrolled courses
- ✅ **Progress Tracking** - Monitor learning progress
- ✅ **User Profile** - View and manage account details
- ✅ **Protected Routes** - Secure API endpoints and pages
- ✅ **Responsive Design** - Works on desktop and mobile

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Styling**: CSS
- **Icons**: RemixIcon

## 📁 Project Structure

```
Edu Track/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/
│   │   │   ├── login/route.js
│   │   │   └── register/route.js
│   │   ├── dashboard/route.js
│   │   └── courses/route.js
│   ├── dashboard/              # Dashboard page
│   │   ├── page.js
│   │   └── dashboard.css
│   ├── login/                  # Login page
│   │   └── page.js
│   ├── register/               # Register page
│   │   └── page.js
│   ├── layout.js               # Root layout
│   ├── page.js                 # Home page (redirects)
│   └── globals.css             # Global styles
├── lib/                        # Utilities
│   ├── dbConnect.js           # MongoDB connection
│   └── auth.js                # JWT utilities
├── models/                     # Database models
│   ├── User.js
│   └── Course.js
├── public/                     # Static assets
│   └── assets/
├── backend/                    # Old Express code (archived)
├── .env.local                 # Environment variables
├── next.config.js             # Next.js configuration
└── package.json               # Dependencies
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB installed and running locally (or MongoDB Atlas connection string)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   Ensure `.env.local` exists with:
   ```env
   MONGODB_URI=mongodb://localhost:27017/edutrack
   JWT_SECRET=edutrack_secret_key
   ```

3. **Start MongoDB** (if running locally):
   
   **macOS (Homebrew)**:
   ```bash
   brew services start mongodb-community
   ```
   
   **Linux**:
   ```bash
   sudo systemctl start mongod
   ```
   
   **Windows**:
   - Start MongoDB from Services or run `mongod.exe`

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 Authentication Flow

1. User registers with name, email, and password
2. Password is hashed with bcrypt before storing
3. User logs in with email and password
4. Server generates JWT token (valid for 7 days)
5. Token is stored in localStorage
6. Protected routes require Bearer token in Authorization header
7. Server validates token for each protected API call

## 🌐 API Endpoints

### Public Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

### Protected Endpoints (require JWT token)

#### Get Dashboard Stats
```http
GET /api/dashboard
Authorization: Bearer YOUR_JWT_TOKEN
```

Response:
```json
{
  "enrolled": 5,
  "completed": 2,
  "inProgress": 3,
  "certificates": 2
}
```

#### Get All Courses
```http
GET /api/courses
Authorization: Bearer YOUR_JWT_TOKEN
```

Response:
```json
[
  {
    "_id": "...",
    "title": "JavaScript Fundamentals",
    "category": "Programming",
    "progress": 45,
    "status": "ongoing"
  }
]
```

## 🎨 Pages

- `/` - Home page (redirects based on auth status)
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (protected)
  - Dashboard overview
  - My Courses
  - Learning Content
  - Certificates
  - Progress
  - Profile
  - Settings
  - Help

## 🗄️ Database Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  timestamps: true
}
```

### Course Model
```javascript
{
  title: String (required),
  category: String (default: 'General'),
  progress: Number (default: 0),
  status: String (enum: ['ongoing', 'completed']),
  timestamps: true
}
```

## 🔧 Configuration

### MongoDB Connection

**Local MongoDB**:
```env
MONGODB_URI=mongodb://localhost:27017/edutrack
```

**MongoDB Atlas**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edutrack
```

### JWT Configuration
```env
JWT_SECRET=your_super_secret_key_here
```

**Important**: Change the JWT_SECRET to a strong random string in production!

## 🚀 Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`

### Other Platforms

- **Netlify**: Supports Next.js with plugins
- **Railway**: Easy deployment with MongoDB support
- **DigitalOcean App Platform**: Docker-based deployment

## 🐛 Troubleshooting

### MongoDB Connection Error

**Error**: `MongoServerError: connect ECONNREFUSED`

**Solution**:
- Ensure MongoDB is running: `mongosh` should connect
- Check connection string in `.env.local`
- For MongoDB Atlas, whitelist your IP address

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Images Not Loading

- Ensure assets are in `public/assets/`
- Use absolute paths: `/assets/image.png`
- Check file names match exactly

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📦 Adding Sample Data

Connect to MongoDB and add sample courses:

```bash
mongosh

use edutrack

db.courses.insertMany([
  {
    title: "JavaScript Fundamentals",
    category: "Programming",
    progress: 45,
    status: "ongoing"
  },
  {
    title: "React Basics",
    category: "Web Development",
    progress: 100,
    status: "completed"
  },
  {
    title: "UI/UX Design",
    category: "Design",
    progress: 30,
    status: "ongoing"
  }
])
```

## ✨ Future Enhancements

- [ ] Add TypeScript
- [ ] Implement course creation functionality
- [ ] Add file upload for profile pictures
- [ ] Integrate email verification
- [ ] Add password reset functionality
- [ ] Implement real-time notifications
- [ ] Add testing (Jest, React Testing Library)
- [ ] Add Tailwind CSS for styling
- [ ] Implement course enrollment system
- [ ] Add course progress tracking
- [ ] Create admin dashboard

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose Documentation](https://mongoosejs.com/docs)
- [JWT.io](https://jwt.io)

---

Made with ❤️ using Next.js

**Happy Learning! 🎓**
