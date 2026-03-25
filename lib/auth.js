import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edutrack_secret_key';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}

export function authenticateRequest(request) {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { authenticated: false, user: null };
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { authenticated: false, user: null };
  }
  
  return { authenticated: true, user: decoded };
}
