import { Peer, MediaConnection, DataConnection } from 'peerjs';

export interface RemoteParticipant {
  peerId: string;
  userName: string;
  avatar?: string;
  stream?: MediaStream;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  isHandRaised?: boolean;
}

export type WebRTCEventListener<T = any> = (data: T) => void;

class WebRTCService {
  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private currentRoomToken: string = '';
  private currentUserName: string = '';
  private currentAvatar?: string;
  private myPeerId: string = '';
  private activeCalls: Map<string, MediaConnection> = new Map();
  private activeConnections: Map<string, DataConnection> = new Map();
  private remoteParticipants: Map<string, RemoteParticipant> = new Map();
  private listeners: Map<string, Set<WebRTCEventListener>> = new Map();
  private heartbeatTimer: any = null;
  private pollPeersTimer: any = null;
  private isConnecting: boolean = false;

  public on(event: string, callback: WebRTCEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: WebRTCEventListener) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, data?: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in WebRTC listener for event "${event}":`, e);
        }
      });
    }
  }

  public getMyPeerId(): string {
    return this.myPeerId;
  }

  public getRemoteParticipants(): RemoteParticipant[] {
    return Array.from(this.remoteParticipants.values());
  }

  public getRemoteStream(userName: string): MediaStream | undefined {
    for (const p of this.remoteParticipants.values()) {
      if (p.userName.toLowerCase() === userName.toLowerCase() && p.stream) {
        return p.stream;
      }
    }
    return undefined;
  }

  /**
   * Initialize and join a meeting room with Live WebRTC audio & video
   */
  public async joinMeetingRoom(
    roomToken: string,
    userName: string,
    localStream?: MediaStream | null,
    avatar?: string
  ): Promise<string> {
    // If already joined same room, update local stream and return
    if (this.peer && this.currentRoomToken === roomToken && !this.peer.destroyed) {
      if (localStream) {
        this.updateLocalStream(localStream);
      }
      return this.myPeerId;
    }

    // Cleanup previous session if any
    this.leaveMeetingRoom();

    this.currentRoomToken = roomToken;
    this.currentUserName = userName;
    this.currentAvatar = avatar;
    this.localStream = localStream || null;
    this.isConnecting = true;
    this.emit('status:changed', { status: 'connecting', message: 'Initializing live WebRTC peer...' });

    // Generate sanitized clean token and peerId
    const cleanToken = roomToken.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const cleanUser = userName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'guest';
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const peerId = `zk_${cleanToken}_${cleanUser}_${randomSuffix}`;

    return new Promise((resolve, reject) => {
      try {
        const peer = new Peer(peerId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        });

        this.peer = peer;

        peer.on('open', (id) => {
          this.myPeerId = id;
          this.isConnecting = false;
          this.emit('status:changed', { status: 'connected', message: 'WebRTC Live Peer Connected' });

          // Start receiving incoming calls and data connections
          this.setupPeerListeners();

          // Discover and call existing peers in the room
          this.discoverAndConnectPeers();

          // Start heartbeat
          this.startHeartbeat();

          resolve(id);
        });

        peer.on('error', (err: any) => {
          console.warn('WebRTC PeerJS error:', err);
          if (err.type === 'unavailable-id') {
            // Retry with alternate randomized ID if collision
            const fallbackId = `zk_${cleanToken}_${cleanUser}_${Date.now().toString(36)}`;
            const fallbackPeer = new Peer(fallbackId, {
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:stun1.l.google.com:19302' },
                ],
              },
            });
            this.peer = fallbackPeer;
            this.setupPeerListeners();
            resolve(fallbackId);
          } else {
            this.emit('status:changed', { status: 'error', message: err.message || 'WebRTC error' });
          }
        });

        peer.on('disconnected', () => {
          this.emit('status:changed', { status: 'disconnected', message: 'Peer disconnected from signaling server' });
          // Attempt automatic reconnect to signaling server
          if (this.peer && !this.peer.destroyed) {
            this.peer.reconnect();
          }
        });
      } catch (err: any) {
        this.isConnecting = false;
        console.error('Failed to create Peer instance:', err);
        reject(err);
      }
    });
  }

  private setupPeerListeners() {
    if (!this.peer) return;

    // Handle incoming audio/video calls from other peers
    this.peer.on('call', (call: MediaConnection) => {
      this.activeCalls.set(call.peer, call);

      // Answer with our local stream (or an empty media stream if cam is off)
      const streamToAnswer = this.localStream || this.createSilentStream();
      call.answer(streamToAnswer);

      call.on('stream', (remoteStream: MediaStream) => {
        this.handleIncomingStream(call.peer, remoteStream);
      });

      call.on('close', () => {
        this.handlePeerLeft(call.peer);
      });

      call.on('error', (err) => {
        console.warn(`Call error with peer ${call.peer}:`, err);
      });
    });

    // Handle incoming data channel connections (for state sync, chat, emoji)
    this.peer.on('connection', (conn: DataConnection) => {
      this.setupDataConnection(conn);
    });
  }

  private setupDataConnection(conn: DataConnection) {
    this.activeConnections.set(conn.peer, conn);

    conn.on('open', () => {
      // Send our identification handshake
      conn.send({
        type: 'HANDSHAKE',
        peerId: this.myPeerId,
        userName: this.currentUserName,
        avatar: this.currentAvatar,
      });
    });

    conn.on('data', (data: any) => {
      this.handleDataMessage(conn.peer, data);
    });

    conn.on('close', () => {
      this.activeConnections.delete(conn.peer);
    });
  }

  private handleIncomingStream(peerId: string, stream: MediaStream) {
    let participant = this.remoteParticipants.get(peerId);
    if (!participant) {
      // Extract user name from peerId format: zk_token_username_suffix
      const parts = peerId.split('_');
      const guessedName = parts.length >= 3 ? parts[2] : `User ${peerId.slice(-4)}`;
      participant = {
        peerId,
        userName: guessedName,
        stream,
      };
      this.remoteParticipants.set(peerId, participant);
    } else {
      participant.stream = stream;
    }

    this.emit('stream:added', {
      peerId,
      userName: participant.userName,
      stream,
    });
  }

  private handleDataMessage(fromPeerId: string, data: any) {
    if (!data || typeof data !== 'object') return;

    switch (data.type) {
      case 'HANDSHAKE': {
        const participant: RemoteParticipant = {
          peerId: fromPeerId,
          userName: data.userName || `User ${fromPeerId.slice(-4)}`,
          avatar: data.avatar,
          isAudioMuted: data.isAudioMuted,
          isVideoMuted: data.isVideoMuted,
          isHandRaised: data.isHandRaised,
          stream: this.remoteParticipants.get(fromPeerId)?.stream,
        };
        this.remoteParticipants.set(fromPeerId, participant);
        this.emit('peer:joined', participant);

        // If we have not called this peer yet with our media stream, call them now
        if (this.localStream && !this.activeCalls.has(fromPeerId) && this.peer) {
          this.callRemotePeer(fromPeerId);
        }
        break;
      }
      case 'STATE_UPDATE': {
        const participant = this.remoteParticipants.get(fromPeerId);
        if (participant) {
          if (data.isAudioMuted !== undefined) participant.isAudioMuted = data.isAudioMuted;
          if (data.isVideoMuted !== undefined) participant.isVideoMuted = data.isVideoMuted;
          if (data.isHandRaised !== undefined) participant.isHandRaised = data.isHandRaised;
          this.emit('state:changed', { peerId: fromPeerId, ...data });
        }
        break;
      }
      case 'CHAT_MESSAGE': {
        this.emit('chat:received', { message: data.message });
        break;
      }
      case 'REACTION': {
        this.emit('reaction:received', { emoji: data.emoji, sender: data.sender });
        break;
      }
      case 'PEER_DISCOVERY_LIST': {
        // Connected peer shared other active peers
        if (Array.isArray(data.peers)) {
          data.peers.forEach((pId: string) => {
            if (pId !== this.myPeerId && !this.activeCalls.has(pId)) {
              this.connectToPeer(pId);
            }
          });
        }
        break;
      }
    }
  }

  private handlePeerLeft(peerId: string) {
    this.activeCalls.delete(peerId);
    this.activeConnections.delete(peerId);
    this.remoteParticipants.delete(peerId);
    this.emit('stream:removed', { peerId });
    this.emit('peer:left', { peerId });
  }

  /**
   * Discover other active peers in room via Backend API (or mesh peer announcement)
   */
  private async discoverAndConnectPeers() {
    if (!this.currentRoomToken || !this.peer) return;

    try {
      // 1. Try Backend API signaling
      const res = await fetch(`/api/rooms/${encodeURIComponent(this.currentRoomToken)}/peers/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peerId: this.myPeerId,
          userName: this.currentUserName,
          avatar: this.currentAvatar,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.peers)) {
          data.peers.forEach((peerInfo: { peerId: string; userName: string; avatar?: string }) => {
            if (peerInfo.peerId !== this.myPeerId && !this.activeCalls.has(peerInfo.peerId)) {
              this.connectToPeer(peerInfo.peerId, peerInfo.userName, peerInfo.avatar);
            }
          });
        }
      }
    } catch (e) {
      // Backend not accessible (e.g. static Vercel deployment)
      console.log('Peer backend registry not reached, using direct peer mesh protocol.');
    }

    // Set up polling for new peers
    if (this.pollPeersTimer) clearInterval(this.pollPeersTimer);
    this.pollPeersTimer = setInterval(() => {
      this.pollBackendPeers();
    }, 4000);
  }

  private async pollBackendPeers() {
    if (!this.currentRoomToken || !this.peer || this.peer.destroyed) return;
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(this.currentRoomToken)}/peers`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.peers)) {
          data.peers.forEach((peerInfo: { peerId: string; userName: string; avatar?: string }) => {
            if (peerInfo.peerId !== this.myPeerId && !this.activeCalls.has(peerInfo.peerId)) {
              this.connectToPeer(peerInfo.peerId, peerInfo.userName, peerInfo.avatar);
            }
          });
        }
      }
    } catch {}
  }

  /**
   * Connect and call a remote peer
   */
  public connectToPeer(remotePeerId: string, remoteUserName?: string, remoteAvatar?: string) {
    if (!this.peer || remotePeerId === this.myPeerId || this.activeCalls.has(remotePeerId)) {
      return;
    }

    // Pre-register remote participant
    if (remoteUserName) {
      this.remoteParticipants.set(remotePeerId, {
        peerId: remotePeerId,
        userName: remoteUserName,
        avatar: remoteAvatar,
      });
    }

    // 1. Establish data connection
    const conn = this.peer.connect(remotePeerId, { reliable: true });
    this.setupDataConnection(conn);

    // 2. Call remote peer with local stream
    this.callRemotePeer(remotePeerId);
  }

  private callRemotePeer(remotePeerId: string) {
    if (!this.peer) return;

    const streamToSend = this.localStream || this.createSilentStream();
    const call = this.peer.call(remotePeerId, streamToSend);
    this.activeCalls.set(remotePeerId, call);

    call.on('stream', (remoteStream: MediaStream) => {
      this.handleIncomingStream(remotePeerId, remoteStream);
    });

    call.on('close', () => {
      this.handlePeerLeft(remotePeerId);
    });

    call.on('error', (err) => {
      console.warn(`Outgoing call error to ${remotePeerId}:`, err);
    });
  }

  /**
   * Dynamically update local stream when camera/mic is toggled or screen share is activated
   */
  public updateLocalStream(newStream: MediaStream) {
    this.localStream = newStream;

    // Replace video and audio tracks for all existing peer connections without renegotiation
    const videoTrack = newStream.getVideoTracks()[0];
    const audioTrack = newStream.getAudioTracks()[0];

    this.activeCalls.forEach((call) => {
      const peerConnection: RTCPeerConnection = (call as any).peerConnection;
      if (peerConnection && peerConnection.getSenders) {
        peerConnection.getSenders().forEach((sender) => {
          if (sender.track?.kind === 'video' && videoTrack) {
            sender.replaceTrack(videoTrack).catch(() => {});
          } else if (sender.track?.kind === 'audio' && audioTrack) {
            sender.replaceTrack(audioTrack).catch(() => {});
          }
        });
      }
    });
  }

  /**
   * Broadcast real-time reaction / emoji to all peers in room
   */
  public broadcastReaction(emoji: string) {
    const payload = {
      type: 'REACTION',
      emoji,
      sender: this.currentUserName,
    };
    this.broadcastData(payload);
  }

  /**
   * Broadcast state changes (mic mute, video mute, hand raise)
   */
  public broadcastState(state: { isAudioMuted?: boolean; isVideoMuted?: boolean; isHandRaised?: boolean }) {
    const payload = {
      type: 'STATE_UPDATE',
      ...state,
    };
    this.broadcastData(payload);
  }

  /**
   * Broadcast chat message
   */
  public broadcastChat(message: any) {
    const payload = {
      type: 'CHAT_MESSAGE',
      message,
    };
    this.broadcastData(payload);
  }

  private broadcastData(payload: any) {
    this.activeConnections.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch (e) {
          console.warn('Failed to send payload to peer:', conn.peer, e);
        }
      }
    });
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(async () => {
      if (!this.currentRoomToken || !this.myPeerId) return;
      try {
        await fetch(`/api/rooms/${encodeURIComponent(this.currentRoomToken)}/peers/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ peerId: this.myPeerId }),
        });
      } catch {}
    }, 8000);
  }

  /**
   * Clean up and leave room
   */
  public leaveMeetingRoom() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pollPeersTimer) {
      clearInterval(this.pollPeersTimer);
      this.pollPeersTimer = null;
    }

    // Notify backend
    if (this.currentRoomToken && this.myPeerId) {
      fetch(`/api/rooms/${encodeURIComponent(this.currentRoomToken)}/peers/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ peerId: this.myPeerId }),
      }).catch(() => {});
    }

    // Close all calls
    this.activeCalls.forEach((call) => {
      try {
        call.close();
      } catch {}
    });
    this.activeCalls.clear();

    // Close all connections
    this.activeConnections.forEach((conn) => {
      try {
        conn.close();
      } catch {}
    });
    this.activeConnections.clear();

    this.remoteParticipants.clear();

    if (this.peer && !this.peer.destroyed) {
      try {
        this.peer.destroy();
      } catch {}
      this.peer = null;
    }

    this.myPeerId = '';
    this.currentRoomToken = '';
    this.localStream = null;
  }

  private createSilentStream(): MediaStream {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const dst = osc.connect(ctx.createMediaStreamDestination()) as any;
      osc.start();
      const track = dst.stream.getAudioTracks()[0];
      track.enabled = false;
      return dst.stream;
    } catch {
      return new MediaStream();
    }
  }
}

export const webrtc = new WebRTCService();
