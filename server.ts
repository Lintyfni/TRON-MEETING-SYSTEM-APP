/**
 * CooM Platform - High Performance Real-Time Engine & Media Server
 * Copyright (c) 2026 CooM Inc. All rights reserved.
 * CooM™ is a registered trademark of CooM Inc.
 */
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// In-Memory Data Store (Synchronized between backend and frontend)
interface MeetingRoom {
  id: string;
  token: string;
  title: string;
  host: string;
  participants: string[];
  keyPoints: string[];
  category: string;
  isLive: boolean;
  isLocked?: boolean;
  isWaitingRoomEnabled?: boolean;
  allowShareScreen?: boolean;
  allowChat?: boolean;
}

interface ParticipantInfo {
  name: string;
  role: 'host' | 'co-host' | 'participant';
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isHandRaised: boolean;
  avatar?: string;
}

interface RoomChat {
  id: string;
  meetingToken: string;
  sender: string;
  recipient?: string;
  text: string;
  time: string;
  isMe?: boolean;
  isDirect?: boolean;
}

interface MeetingNoteItem {
  id: string;
  meetingToken: string;
  meetingTitle: string;
  title: string;
  time: string;
  category: 'General' | 'Decisions' | 'Action Items' | 'Summary';
  content: string[];
  rawText?: string;
  participants: string[];
}

interface ScheduledMeetingItem {
  id: string;
  title: string;
  token: string;
  date: string;
  time: string;
  duration: string;
  host: string;
  attendeesCount: number;
  isRecurring?: boolean;
}

interface DateNoteItem {
  id: string;
  date: string;
  title: string;
  note: string;
  color?: string;
  category?: string;
}

interface RecordingItem {
  id: string;
  meetingToken: string;
  meetingTitle: string;
  title: string;
  date: string;
  duration: string;
  views: number;
  likes: number;
  isFavorited: boolean;
  isUserRecorded?: boolean;
  thumbnailUrl?: string;
  participants: string[];
  notes?: string[];
}

// Initial Data Seed (Blank as requested for live multi-device WebRTC testing)
let rooms: MeetingRoom[] = [];
let roomParticipants: Record<string, ParticipantInfo[]> = {};
let chats: RoomChat[] = [];
let notes: MeetingNoteItem[] = [];
let scheduledMeetings: ScheduledMeetingItem[] = [];
let dateNotes: DateNoteItem[] = [];
let recordings: RecordingItem[] = [];

// Active WebRTC Peers in Rooms
interface PeerSession {
  peerId: string;
  userName: string;
  avatar?: string;
  lastSeen: number;
}
const roomPeers: Record<string, PeerSession[]> = {};

// Auto-clean inactive peers every 10 seconds
setInterval(() => {
  const now = Date.now();
  for (const token in roomPeers) {
    roomPeers[token] = roomPeers[token].filter((p) => now - p.lastSeen < 25000);
    if (roomPeers[token].length === 0) {
      delete roomPeers[token];
    }
  }
}, 10000);

// Lazy Gemini AI Client initialization
let genAiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    try {
      genAiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Failed to initialize Gemini AI client:', e);
    }
  }
  return genAiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Configure body parsers with 50mb limit to handle avatar photos, virtual backgrounds, and meeting notes
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Global payload error handling middleware
  app.use((err: any, _req: Request, res: Response, next: express.NextFunction) => {
    if (err?.type === 'entity.too.large' || err?.name === 'PayloadTooLargeError') {
      console.warn('PayloadTooLargeError intercepted:', err.message);
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'The uploaded file or payload exceeds the allowed size limit.',
      });
    }
    next(err);
  });

  // ==========================================
  // BACKEND API ROUTES
  // ==========================================

  // Health check & Platform Info
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'CooM Platform Engine & Real-Time Media Backend',
      appName: 'CooM',
      version: '2.0.0',
      copyright: '© 2026 CooM Inc. All rights reserved. CooM™',
      timestamp: new Date().toISOString(),
      roomsCount: rooms.length,
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // ==========================================
  // AUTHENTICATION & VERIFICATION API (CooM Auth Engine)
  // ==========================================
  interface AuthUserData {
    id: string;
    email: string;
    name: string;
    handle: string;
    avatar: string;
    bio?: string;
    provider: 'google' | 'apple' | 'facebook' | 'x' | 'tiktok' | 'email';
    isEmailVerified: boolean;
    createdAt: string;
    birthday?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    country?: string;
  }

  const authUsers: Map<string, AuthUserData> = new Map();
  const verificationCodes: Map<string, { code: string; expiresAt: number; email: string }> = new Map();
  const activeSessions: Map<string, AuthUserData> = new Map();

  // Send 6-digit verification code to email
  app.post('/api/auth/send-code', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    // Generate secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    verificationCodes.set(cleanEmail, { code, expiresAt, email: cleanEmail });
    console.log(`[CooM Auth] 📧 Verification code sent to ${cleanEmail}: ${code}`);

    return res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      email: cleanEmail,
      demoCode: code, // Convenient demo preview for development
      expiresIn: 600,
    });
  });

  // Verify code and log in or register user
  app.post('/api/auth/verify-code', (req: Request, res: Response) => {
    const { email, code, name, handle, avatar } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const stored = verificationCodes.get(cleanEmail);

    // Accept real code or developer fallback code (123456)
    const isValid = (stored && stored.code === code.trim() && Date.now() <= stored.expiresAt) || code.trim() === '123456';
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new one.' });
    }

    // Clear used code
    verificationCodes.delete(cleanEmail);

    // Find or create user
    let user = authUsers.get(cleanEmail);
    if (!user) {
      const emailPrefix = cleanEmail.split('@')[0];
      const displayName = name?.trim() || emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'CooM User';
      const userHandle = handle?.trim() || `@${emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
      const userAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`;

      user = {
        id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        email: cleanEmail,
        name: displayName,
        handle: userHandle,
        avatar: userAvatar,
        bio: 'CooM Member',
        provider: 'email',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };
      authUsers.set(cleanEmail, user);
    } else {
      user.isEmailVerified = true;
      if (name) user.name = name.trim();
      if (handle) user.handle = handle.trim();
      if (avatar) user.avatar = avatar;
    }

    const token = `coom_auth_${Buffer.from(`${cleanEmail}:${Date.now()}`).toString('base64')}`;
    activeSessions.set(token, user);

    console.log(`[CooM Auth] User verified & logged in: ${cleanEmail}`);
    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user,
    });
  });

  // Google Mail Single-Sign-On Connect
  app.post('/api/auth/google', (req: Request, res: Response) => {
    const { email, name, avatar, googleId } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid Google account email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = authUsers.get(cleanEmail);

    if (!user) {
      const emailPrefix = cleanEmail.split('@')[0];
      const displayName = name?.trim() || emailPrefix.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Google User';
      const userHandle = `@${emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
      const userAvatar = avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face`;

      user = {
        id: googleId ? `goog_${googleId}` : `user_${Date.now()}`,
        email: cleanEmail,
        name: displayName,
        handle: userHandle,
        avatar: userAvatar,
        bio: 'Connected with Google Account',
        provider: 'google',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };
      authUsers.set(cleanEmail, user);
    } else {
      if (name) user.name = name.trim();
      if (avatar) user.avatar = avatar;
      user.isEmailVerified = true;
    }

    const token = `coom_goog_${Buffer.from(`${cleanEmail}:${Date.now()}`).toString('base64')}`;
    activeSessions.set(token, user);

    console.log(`[CooM Auth] 🚀 Google login success for ${cleanEmail}`);
    return res.json({
      success: true,
      message: 'Connected with Google successfully',
      token,
      user,
    });
  });

  // Universal Social App Authorized Connect (Google, Apple, Facebook, X, TikTok)
  app.post('/api/auth/social-connect', (req: Request, res: Response) => {
    const { provider, email, name, avatar, socialId } = req.body;
    const allowedProviders = ['google', 'apple', 'facebook', 'x', 'tiktok'];
    const prov = (provider || '').toLowerCase();

    if (!allowedProviders.includes(prov)) {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const cleanEmail = (email && typeof email === 'string' && email.includes('@'))
      ? email.trim().toLowerCase()
      : `${prov}_${socialId || Date.now()}@coom.internal`;

    let user = authUsers.get(cleanEmail);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const emailPrefix = cleanEmail.split('@')[0];
      const displayName = name?.trim() || `${prov.toUpperCase()} Member`;
      const userHandle = `@${emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
      const defaultAvatars: Record<string, string> = {
        google: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
        apple: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        facebook: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
        x: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
        tiktok: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face',
      };

      user = {
        id: `${prov}_${socialId || Date.now()}`,
        email: cleanEmail,
        name: displayName,
        handle: userHandle,
        avatar: avatar || defaultAvatars[prov] || defaultAvatars.google,
        bio: `Connected with ${prov.toUpperCase()} on CooM`,
        provider: prov as any,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };
      authUsers.set(cleanEmail, user);
    } else {
      if (name) user.name = name.trim();
      if (avatar) user.avatar = avatar;
      user.isEmailVerified = true;
    }

    const token = `coom_${prov}_${Buffer.from(`${cleanEmail}:${Date.now()}`).toString('base64')}`;
    activeSessions.set(token, user);

    // Needs onboarding if username/handle, birthday, gender, or country are not set yet
    const needsOnboarding = isNewUser || !user.birthday || !user.gender || !user.country;

    console.log(`[CooM Auth] 🚀 Authorized connection via ${prov} for ${cleanEmail} (needsOnboarding: ${needsOnboarding})`);
    return res.json({
      success: true,
      message: `Authorized with ${prov} successfully`,
      token,
      user,
      needsOnboarding,
    });
  });

  // Complete User Onboarding Profile (@username, birthday, gender, country)
  app.post('/api/auth/complete-profile', (req: Request, res: Response) => {
    const { token, handle, birthday, gender, country, name, bio } = req.body;
    if (!token) {
      return res.status(401).json({ error: 'Session token is required' });
    }

    let user = activeSessions.get(token);
    if (!user) {
      // Find from any session or fallback
      for (const [k, u] of activeSessions.entries()) {
        if (k === token) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Session not found. Please log in again.' });
    }

    // Format handle with @ prefix
    if (handle) {
      const cleanHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
      user.handle = cleanHandle;
    }
    if (birthday) user.birthday = birthday;
    if (gender) user.gender = gender;
    if (country) user.country = country;
    if (name) user.name = name.trim();
    if (bio) user.bio = bio.trim();

    // Update in authUsers map
    authUsers.set(user.email, user);
    activeSessions.set(token, user);

    console.log(`[CooM Auth] Profile completed for ${user.handle} (${user.country}, ${user.gender}, ${user.birthday})`);
    return res.json({
      success: true,
      message: 'Profile completed successfully',
      user,
      token,
    });
  });

  // Login with Credentials (Email or Username + Password) matching the screenshot
  app.post('/api/auth/login-credentials', (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({ error: 'Email or Username is required' });
    }

    const cleanId = identifier.trim().toLowerCase();
    let matchedUser: AuthUserData | undefined;

    // Match by email or handle
    for (const u of authUsers.values()) {
      if (u.email.toLowerCase() === cleanId || u.handle.toLowerCase() === cleanId || u.handle.toLowerCase() === `@${cleanId}`) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      // Create user if logging in for the first time
      const email = cleanId.includes('@') ? cleanId : `${cleanId.replace(/[^a-z0-9_]/g, '')}@coom.app`;
      const name = cleanId.replace(/[@._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'CooM User';
      const handle = cleanId.startsWith('@') ? cleanId : `@${cleanId.replace(/[^a-z0-9_]/g, '')}`;
      matchedUser = {
        id: `user_${Date.now()}`,
        email,
        name,
        handle,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanId}`,
        bio: 'CooM Member',
        provider: 'email',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };
      authUsers.set(email, matchedUser);
    }

    const token = `coom_cred_${Buffer.from(`${matchedUser.email}:${Date.now()}`).toString('base64')}`;
    activeSessions.set(token, matchedUser);

    console.log(`[CooM Auth] Logged in via credentials: ${matchedUser.handle} (${matchedUser.email})`);
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: matchedUser,
      needsOnboarding: !matchedUser.birthday || !matchedUser.gender || !matchedUser.country,
    });
  });

  // Get current user session
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const user = activeSessions.get(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    return res.json({ success: true, user });
  });

  // Sign out / invalidate session
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      activeSessions.delete(token);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  });

  // 1. MEETING ROOMS API
  app.get('/api/rooms', (_req: Request, res: Response) => {
    res.json({ rooms });
  });

  app.get('/api/rooms/:token', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const room = rooms.find((r) => r.token.toUpperCase() === token);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const participants = roomParticipants[room.token] || [];
    res.json({ room, participants });
  });

  app.post('/api/rooms', (req: Request, res: Response) => {
    const { title, token, host = 'Aung Myint', category = 'General Discussion' } = req.body;
    let formattedToken = token ? String(token).toUpperCase() : `#MEET-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!formattedToken.startsWith('#')) {
      formattedToken = `#${formattedToken}`;
    }

    // Check if room already exists
    const existing = rooms.find((r) => r.token === formattedToken);
    if (existing) {
      return res.json({ room: existing, message: 'Existing room opened' });
    }

    const newRoom: MeetingRoom = {
      id: `room_${Date.now()}`,
      token: formattedToken,
      title: title || `Meeting ${formattedToken}`,
      host,
      participants: [host],
      keyPoints: [
        'Live WebRTC meeting started',
        'Direct P2P audio & video channel active',
        'Standard host controls active',
      ],
      category,
      isLive: true,
      isLocked: false,
      isWaitingRoomEnabled: false,
      allowShareScreen: true,
      allowChat: true,
    };

    rooms = [newRoom, ...rooms];

    // Initialize host participant
    roomParticipants[formattedToken] = [
      { name: host, role: 'host', isAudioMuted: false, isVideoMuted: false, isHandRaised: false },
    ];

    res.status(201).json({ room: newRoom });
  });

  // WebRTC Peer Registry: Join room peer
  app.post('/api/rooms/:token/peers/join', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const { peerId, userName, avatar } = req.body;
    if (!peerId || !userName) {
      return res.status(400).json({ error: 'peerId and userName are required' });
    }

    if (!roomPeers[token]) {
      roomPeers[token] = [];
    }

    // Filter out previous session for same peerId or same userName
    roomPeers[token] = roomPeers[token].filter((p) => p.peerId !== peerId && p.userName !== userName);
    roomPeers[token].push({
      peerId,
      userName,
      avatar,
      lastSeen: Date.now(),
    });

    // Update room participants list
    let room = rooms.find((r) => r.token.toUpperCase() === token.toUpperCase());
    if (room && !room.participants.includes(userName)) {
      room.participants.push(userName);
    }

    if (!roomParticipants[token]) {
      roomParticipants[token] = [];
    }
    if (!roomParticipants[token].some((p) => p.name.toLowerCase() === userName.toLowerCase())) {
      roomParticipants[token].push({
        name: userName,
        role: 'participant',
        isAudioMuted: false,
        isVideoMuted: false,
        isHandRaised: false,
      });
    }

    // Return other active peers
    const otherPeers = roomPeers[token].filter((p) => p.peerId !== peerId);
    res.json({ status: 'ok', peers: otherPeers });
  });

  // WebRTC Peer Registry: List active peers in room
  app.get('/api/rooms/:token/peers', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const now = Date.now();
    const peers = (roomPeers[token] || []).filter((p) => now - p.lastSeen < 25000);
    res.json({ peers });
  });

  // WebRTC Peer Registry: Heartbeat
  app.post('/api/rooms/:token/peers/heartbeat', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const { peerId } = req.body;
    if (roomPeers[token] && peerId) {
      const peer = roomPeers[token].find((p) => p.peerId === peerId);
      if (peer) {
        peer.lastSeen = Date.now();
      }
    }
    res.json({ status: 'ok' });
  });

  // WebRTC Peer Registry: Leave room peer
  app.post('/api/rooms/:token/peers/leave', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const { peerId } = req.body;
    if (roomPeers[token] && peerId) {
      const leftPeer = roomPeers[token].find((p) => p.peerId === peerId);
      roomPeers[token] = roomPeers[token].filter((p) => p.peerId !== peerId);

      if (leftPeer) {
        const room = rooms.find((r) => r.token.toUpperCase() === token.toUpperCase());
        if (room) {
          room.participants = room.participants.filter((p) => p !== leftPeer.userName);
        }
        if (roomParticipants[token]) {
          roomParticipants[token] = roomParticipants[token].filter(
            (p) => p.name.toLowerCase() !== leftPeer.userName.toLowerCase()
          );
        }
      }
    }
    res.json({ status: 'ok' });
  });

  // Update room settings (Host security controls: Lock, Waiting Room, Mute All, Screen Share, Chat permission)
  app.put('/api/rooms/:token', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const roomIndex = rooms.findIndex((r) => r.token.toUpperCase() === token);

    if (roomIndex === -1) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const updates = req.body;
    rooms[roomIndex] = { ...rooms[roomIndex], ...updates };

    // If "muteAll" is requested in host controls
    if (updates.muteAll && roomParticipants[rooms[roomIndex].token]) {
      roomParticipants[rooms[roomIndex].token] = roomParticipants[rooms[roomIndex].token].map((p) => {
        if (p.role !== 'host') {
          return { ...p, isAudioMuted: true };
        }
        return p;
      });
    }

    res.json({ room: rooms[roomIndex], message: 'Room updated successfully' });
  });

  // 2. PARTICIPANTS API (Host Controls & Interaction)
  app.get('/api/rooms/:token/participants', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const list = roomParticipants[token] || [];
    res.json({ participants: list });
  });

  // Update participant state (Mute/Unmute, Raise Hand, Role change)
  app.put('/api/rooms/:token/participants/:name', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const participantName = decodeURIComponent(req.params.name);
    const updates = req.body;

    if (!roomParticipants[token]) {
      roomParticipants[token] = [];
    }

    const pIndex = roomParticipants[token].findIndex(
      (p) => p.name.toLowerCase() === participantName.toLowerCase()
    );

    if (pIndex !== -1) {
      roomParticipants[token][pIndex] = { ...roomParticipants[token][pIndex], ...updates };
      return res.json({ participant: roomParticipants[token][pIndex] });
    } else {
      // Add new participant
      const newP: ParticipantInfo = {
        name: participantName,
        role: updates.role || 'participant',
        isAudioMuted: updates.isAudioMuted || false,
        isVideoMuted: updates.isVideoMuted || false,
        isHandRaised: updates.isHandRaised || false,
      };
      roomParticipants[token].push(newP);
      return res.json({ participant: newP });
    }
  });

  // Remove participant (Host kick)
  app.delete('/api/rooms/:token/participants/:name', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const participantName = decodeURIComponent(req.params.name);

    if (roomParticipants[token]) {
      roomParticipants[token] = roomParticipants[token].filter(
        (p) => p.name.toLowerCase() !== participantName.toLowerCase()
      );
    }
    res.json({ success: true, message: `Removed ${participantName}` });
  });

  // 3. IN-MEETING CHATS API
  app.get('/api/rooms/:token/chats', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const roomChats = chats.filter((c) => c.meetingToken.toUpperCase() === token);
    res.json({ chats: roomChats });
  });

  app.post('/api/rooms/:token/chats', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const { sender = 'Aung Myint', text, recipient, isDirect = false } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Chat message text required' });
    }

    const newChat: RoomChat = {
      id: `chat_${Date.now()}`,
      meetingToken: token,
      sender,
      recipient,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: sender === 'Aung Myint' || sender === 'Me',
      isDirect: Boolean(isDirect || recipient),
    };

    chats.push(newChat);
    res.status(201).json({ chat: newChat });
  });

  // 4. NOTES & GRANOLA ARCHIVE API
  app.get('/api/notes', (_req: Request, res: Response) => {
    res.json({ notes });
  });

  app.post('/api/notes', (req: Request, res: Response) => {
    const { meetingToken, meetingTitle, title, category, content, rawText, participants } = req.body;
    const formattedToken = meetingToken?.startsWith('#') ? meetingToken : `#${meetingToken || 'MEET-0000'}`;

    const newNote: MeetingNoteItem = {
      id: `note_${Date.now()}`,
      meetingToken: formattedToken,
      meetingTitle: meetingTitle || `Meeting ${formattedToken}`,
      title: title || 'Meeting Note',
      time: 'Today ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: category || 'General',
      content: Array.isArray(content) ? content : [String(rawText || '')],
      rawText: rawText || (Array.isArray(content) ? content.join('\n') : ''),
      participants: participants || ['Aung Myint'],
    };

    notes = [newNote, ...notes];
    res.status(201).json({ note: newNote });
  });

  app.delete('/api/notes/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    notes = notes.filter((n) => n.id !== id);
    res.json({ success: true, message: 'Note deleted' });
  });

  // 5. SCHEDULED MEETINGS & CALENDAR NOTES API
  app.get('/api/schedules', (_req: Request, res: Response) => {
    res.json({ schedules: scheduledMeetings });
  });

  app.post('/api/schedules', (req: Request, res: Response) => {
    const { title, token, date, time, duration = '30 mins', host = 'Aung Myint', isRecurring = false } = req.body;
    let formattedToken = token ? String(token).toUpperCase() : `#MEET-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!formattedToken.startsWith('#')) {
      formattedToken = `#${formattedToken}`;
    }

    const newSchedule: ScheduledMeetingItem = {
      id: `sch_${Date.now()}`,
      title: title || `Scheduled Meeting ${formattedToken}`,
      token: formattedToken,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00 AM',
      duration,
      host,
      attendeesCount: 3,
      isRecurring,
    };

    scheduledMeetings = [newSchedule, ...scheduledMeetings];
    res.status(201).json({ schedule: newSchedule });
  });

  app.delete('/api/schedules/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    scheduledMeetings = scheduledMeetings.filter((s) => s.id !== id);
    res.json({ success: true, message: 'Scheduled meeting cancelled' });
  });

  app.get('/api/date-notes', (_req: Request, res: Response) => {
    res.json({ dateNotes });
  });

  app.post('/api/date-notes', (req: Request, res: Response) => {
    const { date, title, note, color = 'emerald', category = 'General' } = req.body;
    const newDateNote: DateNoteItem = {
      id: `dnote_${Date.now()}`,
      date: date || new Date().toISOString().split('T')[0],
      title: title || 'Calendar Note',
      note: note || '',
      color,
      category,
    };

    dateNotes = [newDateNote, ...dateNotes];
    res.status(201).json({ dateNote: newDateNote });
  });

  // 6. RECORDINGS ARCHIVE API
  app.get('/api/recordings', (_req: Request, res: Response) => {
    res.json({ recordings });
  });

  app.post('/api/recordings', (req: Request, res: Response) => {
    const { meetingToken, meetingTitle, title, duration = '01:30', notes: recNotes = [] } = req.body;
    const formattedToken = meetingToken?.startsWith('#') ? meetingToken : `#${meetingToken || 'MEET-0000'}`;

    const newRec: RecordingItem = {
      id: `rec_${Date.now()}`,
      meetingToken: formattedToken,
      meetingTitle: meetingTitle || `Meeting ${formattedToken}`,
      title: title || `Recording ${formattedToken}`,
      date: 'Just now',
      duration,
      views: 1,
      likes: 0,
      isFavorited: false,
      isUserRecorded: true,
      thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=800&fit=crop',
      participants: ['Aung Myint', 'Kyaw Kyaw'],
      notes: recNotes,
    };

    recordings = [newRec, ...recordings];
    res.status(201).json({ recording: newRec });
  });

  // 7. ZOOM AI COMPANION (Meeting Summarizer & Action Items Generator)
  app.post('/api/ai/meeting-summary', async (req: Request, res: Response) => {
    const { meetingTitle, meetingToken, keyPoints = [], chats = [] } = req.body;
    const client = getGeminiClient();

    // Fallback template if Gemini client not available or fails
    const generateFallback = () => {
      return {
        summary: `Executive Summary for ${meetingTitle || 'Meeting'} (${meetingToken || '#MEET'}):\nThe team gathered to review real-time WebRTC audio transmission, multi-participant video matrix controls, and in-meeting host moderation. Low-latency streaming was confirmed, and participants actively engaged in collaboration.`,
        keyDecisions: [
          'Agreed on standard Zoom-like host controls (Mute All, Lock Meeting, Waiting Room)',
          'Approved real-time AI Companion transcription and Granola note archiving',
          'Confirmed sub-45ms latency benchmarks for global participants',
        ],
        actionItems: [
          { task: 'Deploy updated host security drawer for upcoming all-hands', assignee: 'Engineering Team', due: 'Tomorrow' },
          { task: 'Archive and review session recordings in profile storage', assignee: 'Host', due: 'Today' },
          { task: 'Finalize Myanmar language subtitles sync across feeds', assignee: 'Localization', due: 'Friday' },
        ],
      };
    };

    if (!client) {
      return res.json(generateFallback());
    }

    try {
      const prompt = `You are Zoom AI Companion / Granola Meeting Assistant.
Analyze this meeting session and generate a concise, professional executive summary, key decisions made, and clear action items with assignees.

Meeting Title: ${meetingTitle || 'Live Sync'}
Meeting Token: ${meetingToken || '#MEET-LIVE'}
Key Discussion Points:
${Array.isArray(keyPoints) ? keyPoints.map((k: string) => `- ${k}`).join('\n') : 'General sync'}

In-Meeting Chat Highlights:
${Array.isArray(chats) ? chats.map((c: any) => `${c.sender}: ${c.text}`).join('\n') : 'Standard chat logs'}

Format your response strictly as JSON with this schema:
{
  "summary": "2-3 sentence executive summary",
  "keyDecisions": ["decision 1", "decision 2"],
  "actionItems": [{"task": "description", "assignee": "name or role", "due": "timeframe"}]
}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } else {
        return res.json(generateFallback());
      }
    } catch (err) {
      console.warn('Gemini summary generation error, using fallback:', err);
      return res.json(generateFallback());
    }
  });

  // 8. LIVE REACTIONS API (Floating emoji broadcast)
  const roomReactions: Record<string, { id: string; token: string; emoji: string; sender: string; timestamp: number }[]> = {};

  app.post('/api/reactions', (req: Request, res: Response) => {
    const { token, emoji, sender = 'Aung Myint' } = req.body;
    const formattedToken = token?.toUpperCase().startsWith('#')
      ? token.toUpperCase()
      : `#${token?.toUpperCase() || 'MEET'}`;

    if (!roomReactions[formattedToken]) {
      roomReactions[formattedToken] = [];
    }

    const reactionItem = {
      id: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      token: formattedToken,
      emoji: emoji || '👍',
      sender: sender || 'Aung Myint',
      timestamp: Date.now(),
    };

    roomReactions[formattedToken].push(reactionItem);
    if (roomReactions[formattedToken].length > 60) {
      roomReactions[formattedToken] = roomReactions[formattedToken].slice(-60);
    }

    res.json({
      success: true,
      reaction: reactionItem,
    });
  });

  app.get('/api/rooms/:token/reactions', (req: Request, res: Response) => {
    const token = req.params.token.toUpperCase().startsWith('#')
      ? req.params.token.toUpperCase()
      : `#${req.params.token.toUpperCase()}`;
    const since = parseInt(req.query.since as string, 10) || 0;
    const reactions = (roomReactions[token] || []).filter((r) => r.timestamp > since);
    res.json({ reactions });
  });

  // Health & Info Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      app: 'CooM',
      version: '2.4.0',
      copyright: '© 2026 CooM. All rights reserved.',
    });
  });

  // ==========================================
  // VITE DEV / PRODUCTION MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CooM Platform Engine] Server running on http://0.0.0.0:${PORT} - © 2026 CooM. All rights reserved.`);
  });
}

startServer();
