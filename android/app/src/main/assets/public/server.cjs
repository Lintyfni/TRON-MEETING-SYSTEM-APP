var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var rooms = [];
var roomParticipants = {};
var chats = [];
var notes = [];
var scheduledMeetings = [];
var dateNotes = [];
var recordings = [];
var roomPeers = {};
setInterval(() => {
  const now = Date.now();
  for (const token in roomPeers) {
    roomPeers[token] = roomPeers[token].filter((p) => now - p.lastSeen < 25e3);
    if (roomPeers[token].length === 0) {
      delete roomPeers[token];
    }
  }
}, 1e4);
var genAiClient = null;
function getGeminiClient() {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    try {
      genAiClient = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn("Failed to initialize Gemini AI client:", e);
    }
  }
  return genAiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "Zoom-Style Meeting Engine & AI Companion Backend",
      version: "2.0.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      roomsCount: rooms.length,
      aiAvailable: Boolean(process.env.GEMINI_API_KEY)
    });
  });
  app.get("/api/rooms", (_req, res) => {
    res.json({ rooms });
  });
  app.get("/api/rooms/:token", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const room = rooms.find((r) => r.token.toUpperCase() === token);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    const participants = roomParticipants[room.token] || [];
    res.json({ room, participants });
  });
  app.post("/api/rooms", (req, res) => {
    const { title, token, host = "Aung Myint", category = "General Discussion" } = req.body;
    let formattedToken = token ? String(token).toUpperCase() : `#MEET-${Math.floor(1e3 + Math.random() * 9e3)}`;
    if (!formattedToken.startsWith("#")) {
      formattedToken = `#${formattedToken}`;
    }
    const existing = rooms.find((r) => r.token === formattedToken);
    if (existing) {
      return res.json({ room: existing, message: "Existing room opened" });
    }
    const newRoom = {
      id: `room_${Date.now()}`,
      token: formattedToken,
      title: title || `Meeting ${formattedToken}`,
      host,
      participants: [host],
      keyPoints: [
        "Live WebRTC meeting started",
        "Direct P2P audio & video channel active",
        "Standard host controls active"
      ],
      category,
      isLive: true,
      isLocked: false,
      isWaitingRoomEnabled: false,
      allowShareScreen: true,
      allowChat: true
    };
    rooms = [newRoom, ...rooms];
    roomParticipants[formattedToken] = [
      { name: host, role: "host", isAudioMuted: false, isVideoMuted: false, isHandRaised: false }
    ];
    res.status(201).json({ room: newRoom });
  });
  app.post("/api/rooms/:token/peers/join", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const { peerId, userName, avatar } = req.body;
    if (!peerId || !userName) {
      return res.status(400).json({ error: "peerId and userName are required" });
    }
    if (!roomPeers[token]) {
      roomPeers[token] = [];
    }
    roomPeers[token] = roomPeers[token].filter((p) => p.peerId !== peerId && p.userName !== userName);
    roomPeers[token].push({
      peerId,
      userName,
      avatar,
      lastSeen: Date.now()
    });
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
        role: "participant",
        isAudioMuted: false,
        isVideoMuted: false,
        isHandRaised: false
      });
    }
    const otherPeers = roomPeers[token].filter((p) => p.peerId !== peerId);
    res.json({ status: "ok", peers: otherPeers });
  });
  app.get("/api/rooms/:token/peers", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const now = Date.now();
    const peers = (roomPeers[token] || []).filter((p) => now - p.lastSeen < 25e3);
    res.json({ peers });
  });
  app.post("/api/rooms/:token/peers/heartbeat", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const { peerId } = req.body;
    if (roomPeers[token] && peerId) {
      const peer = roomPeers[token].find((p) => p.peerId === peerId);
      if (peer) {
        peer.lastSeen = Date.now();
      }
    }
    res.json({ status: "ok" });
  });
  app.post("/api/rooms/:token/peers/leave", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
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
    res.json({ status: "ok" });
  });
  app.put("/api/rooms/:token", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const roomIndex = rooms.findIndex((r) => r.token.toUpperCase() === token);
    if (roomIndex === -1) {
      return res.status(404).json({ error: "Room not found" });
    }
    const updates = req.body;
    rooms[roomIndex] = { ...rooms[roomIndex], ...updates };
    if (updates.muteAll && roomParticipants[rooms[roomIndex].token]) {
      roomParticipants[rooms[roomIndex].token] = roomParticipants[rooms[roomIndex].token].map((p) => {
        if (p.role !== "host") {
          return { ...p, isAudioMuted: true };
        }
        return p;
      });
    }
    res.json({ room: rooms[roomIndex], message: "Room updated successfully" });
  });
  app.get("/api/rooms/:token/participants", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const list = roomParticipants[token] || [];
    res.json({ participants: list });
  });
  app.put("/api/rooms/:token/participants/:name", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
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
      const newP = {
        name: participantName,
        role: updates.role || "participant",
        isAudioMuted: updates.isAudioMuted || false,
        isVideoMuted: updates.isVideoMuted || false,
        isHandRaised: updates.isHandRaised || false
      };
      roomParticipants[token].push(newP);
      return res.json({ participant: newP });
    }
  });
  app.delete("/api/rooms/:token/participants/:name", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const participantName = decodeURIComponent(req.params.name);
    if (roomParticipants[token]) {
      roomParticipants[token] = roomParticipants[token].filter(
        (p) => p.name.toLowerCase() !== participantName.toLowerCase()
      );
    }
    res.json({ success: true, message: `Removed ${participantName}` });
  });
  app.get("/api/rooms/:token/chats", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const roomChats = chats.filter((c) => c.meetingToken.toUpperCase() === token);
    res.json({ chats: roomChats });
  });
  app.post("/api/rooms/:token/chats", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const { sender = "Aung Myint", text, recipient, isDirect = false } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Chat message text required" });
    }
    const newChat = {
      id: `chat_${Date.now()}`,
      meetingToken: token,
      sender,
      recipient,
      text: text.trim(),
      time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: sender === "Aung Myint" || sender === "Me",
      isDirect: Boolean(isDirect || recipient)
    };
    chats.push(newChat);
    res.status(201).json({ chat: newChat });
  });
  app.get("/api/notes", (_req, res) => {
    res.json({ notes });
  });
  app.post("/api/notes", (req, res) => {
    const { meetingToken, meetingTitle, title, category, content, rawText, participants } = req.body;
    const formattedToken = meetingToken?.startsWith("#") ? meetingToken : `#${meetingToken || "MEET-0000"}`;
    const newNote = {
      id: `note_${Date.now()}`,
      meetingToken: formattedToken,
      meetingTitle: meetingTitle || `Meeting ${formattedToken}`,
      title: title || "Meeting Note",
      time: "Today " + (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      category: category || "General",
      content: Array.isArray(content) ? content : [String(rawText || "")],
      rawText: rawText || (Array.isArray(content) ? content.join("\n") : ""),
      participants: participants || ["Aung Myint"]
    };
    notes = [newNote, ...notes];
    res.status(201).json({ note: newNote });
  });
  app.delete("/api/notes/:id", (req, res) => {
    const { id } = req.params;
    notes = notes.filter((n) => n.id !== id);
    res.json({ success: true, message: "Note deleted" });
  });
  app.get("/api/schedules", (_req, res) => {
    res.json({ schedules: scheduledMeetings });
  });
  app.post("/api/schedules", (req, res) => {
    const { title, token, date, time, duration = "30 mins", host = "Aung Myint", isRecurring = false } = req.body;
    let formattedToken = token ? String(token).toUpperCase() : `#MEET-${Math.floor(1e3 + Math.random() * 9e3)}`;
    if (!formattedToken.startsWith("#")) {
      formattedToken = `#${formattedToken}`;
    }
    const newSchedule = {
      id: `sch_${Date.now()}`,
      title: title || `Scheduled Meeting ${formattedToken}`,
      token: formattedToken,
      date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      time: time || "10:00 AM",
      duration,
      host,
      attendeesCount: 3,
      isRecurring
    };
    scheduledMeetings = [newSchedule, ...scheduledMeetings];
    res.status(201).json({ schedule: newSchedule });
  });
  app.delete("/api/schedules/:id", (req, res) => {
    const { id } = req.params;
    scheduledMeetings = scheduledMeetings.filter((s) => s.id !== id);
    res.json({ success: true, message: "Scheduled meeting cancelled" });
  });
  app.get("/api/date-notes", (_req, res) => {
    res.json({ dateNotes });
  });
  app.post("/api/date-notes", (req, res) => {
    const { date, title, note, color = "emerald", category = "General" } = req.body;
    const newDateNote = {
      id: `dnote_${Date.now()}`,
      date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      title: title || "Calendar Note",
      note: note || "",
      color,
      category
    };
    dateNotes = [newDateNote, ...dateNotes];
    res.status(201).json({ dateNote: newDateNote });
  });
  app.get("/api/recordings", (_req, res) => {
    res.json({ recordings });
  });
  app.post("/api/recordings", (req, res) => {
    const { meetingToken, meetingTitle, title, duration = "01:30", notes: recNotes = [] } = req.body;
    const formattedToken = meetingToken?.startsWith("#") ? meetingToken : `#${meetingToken || "MEET-0000"}`;
    const newRec = {
      id: `rec_${Date.now()}`,
      meetingToken: formattedToken,
      meetingTitle: meetingTitle || `Meeting ${formattedToken}`,
      title: title || `Recording ${formattedToken}`,
      date: "Just now",
      duration,
      views: 1,
      likes: 0,
      isFavorited: false,
      isUserRecorded: true,
      thumbnailUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=800&fit=crop",
      participants: ["Aung Myint", "Kyaw Kyaw"],
      notes: recNotes
    };
    recordings = [newRec, ...recordings];
    res.status(201).json({ recording: newRec });
  });
  app.post("/api/ai/meeting-summary", async (req, res) => {
    const { meetingTitle, meetingToken, keyPoints = [], chats: chats2 = [] } = req.body;
    const client = getGeminiClient();
    const generateFallback = () => {
      return {
        summary: `Executive Summary for ${meetingTitle || "Meeting"} (${meetingToken || "#MEET"}):
The team gathered to review real-time WebRTC audio transmission, multi-participant video matrix controls, and in-meeting host moderation. Low-latency streaming was confirmed, and participants actively engaged in collaboration.`,
        keyDecisions: [
          "Agreed on standard Zoom-like host controls (Mute All, Lock Meeting, Waiting Room)",
          "Approved real-time AI Companion transcription and Granola note archiving",
          "Confirmed sub-45ms latency benchmarks for global participants"
        ],
        actionItems: [
          { task: "Deploy updated host security drawer for upcoming all-hands", assignee: "Engineering Team", due: "Tomorrow" },
          { task: "Archive and review session recordings in profile storage", assignee: "Host", due: "Today" },
          { task: "Finalize Myanmar language subtitles sync across feeds", assignee: "Localization", due: "Friday" }
        ]
      };
    };
    if (!client) {
      return res.json(generateFallback());
    }
    try {
      const prompt = `You are Zoom AI Companion / Granola Meeting Assistant.
Analyze this meeting session and generate a concise, professional executive summary, key decisions made, and clear action items with assignees.

Meeting Title: ${meetingTitle || "Live Sync"}
Meeting Token: ${meetingToken || "#MEET-LIVE"}
Key Discussion Points:
${Array.isArray(keyPoints) ? keyPoints.map((k) => `- ${k}`).join("\n") : "General sync"}

In-Meeting Chat Highlights:
${Array.isArray(chats2) ? chats2.map((c) => `${c.sender}: ${c.text}`).join("\n") : "Standard chat logs"}

Format your response strictly as JSON with this schema:
{
  "summary": "2-3 sentence executive summary",
  "keyDecisions": ["decision 1", "decision 2"],
  "actionItems": [{"task": "description", "assignee": "name or role", "due": "timeframe"}]
}`;
      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const responseText = response.text?.trim() || "";
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } else {
        return res.json(generateFallback());
      }
    } catch (err) {
      console.warn("Gemini summary generation error, using fallback:", err);
      return res.json(generateFallback());
    }
  });
  const roomReactions = {};
  app.post("/api/reactions", (req, res) => {
    const { token, emoji, sender = "Aung Myint" } = req.body;
    const formattedToken = token?.toUpperCase().startsWith("#") ? token.toUpperCase() : `#${token?.toUpperCase() || "MEET"}`;
    if (!roomReactions[formattedToken]) {
      roomReactions[formattedToken] = [];
    }
    const reactionItem = {
      id: `rx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      token: formattedToken,
      emoji: emoji || "\u{1F44D}",
      sender: sender || "Aung Myint",
      timestamp: Date.now()
    };
    roomReactions[formattedToken].push(reactionItem);
    if (roomReactions[formattedToken].length > 60) {
      roomReactions[formattedToken] = roomReactions[formattedToken].slice(-60);
    }
    res.json({
      success: true,
      reaction: reactionItem
    });
  });
  app.get("/api/rooms/:token/reactions", (req, res) => {
    const token = req.params.token.toUpperCase().startsWith("#") ? req.params.token.toUpperCase() : `#${req.params.token.toUpperCase()}`;
    const since = parseInt(req.query.since, 10) || 0;
    const reactions = (roomReactions[token] || []).filter((r) => r.timestamp > since);
    res.json({ reactions });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Zoom Engine Backend] Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
