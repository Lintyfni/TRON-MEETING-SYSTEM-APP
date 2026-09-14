import { FaceTrackingState } from '../types';

export class FaceTrackingEngine {
  private video: HTMLVideoElement | null = null;
  private audioStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;

  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | null;

  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private nativeFaceDetector: any = null;

  // Smoothing filters (LERP)
  private currentX = 0.5;
  private currentY = 0.45;
  private currentW = 0.38;
  private currentH = 0.48;
  private currentRoll = 0;
  private currentPitch = 0;
  private currentYaw = 0;
  private currentMouthOpen = 0;
  private currentSmile = 0.2;
  private currentLeftBlink = 0;
  private currentRightBlink = 0;
  private currentAudioVol = 0;

  // Blinking timer fallback
  private lastBlinkTime = Date.now();
  private isBlinking = false;
  private blinkDuration = 120; // ms

  // Callback
  private onTrackCallback: ((state: FaceTrackingState) => void) | null = null;

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = 64;
    this.offscreenCanvas.height = 64;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

    // Check for native Shape Detection API (standard in Chrome / Android WebView)
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        this.nativeFaceDetector = new (window as any).FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      } catch (e) {
        this.nativeFaceDetector = null;
      }
    }
  }

  public setVideoElement(video: HTMLVideoElement | null) {
    this.video = video;
  }

  public setAudioStream(stream: MediaStream | null) {
    if (this.audioStream === stream) return;
    this.audioStream = stream;
    this.initAudioAnalyser();
  }

  private initAudioAnalyser() {
    try {
      if (!this.audioStream) {
        if (this.audioCtx) {
          this.audioCtx.close().catch(() => {});
          this.audioCtx = null;
        }
        this.analyser = null;
        return;
      }

      const audioTracks = this.audioStream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      const source = this.audioCtx.createMediaStreamSource(this.audioStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.4;
      source.connect(this.analyser);
      this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (err) {
      console.warn('Audio analyser init warning:', err);
    }
  }

  public start(onTrack: (state: FaceTrackingState) => void) {
    this.onTrackCallback = onTrack;
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
  }

  private loop = () => {
    if (!this.isRunning) return;

    this.processFrame();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private processFrame() {
    let targetX = 0.5;
    let targetY = 0.45;
    let targetW = 0.4;
    let targetH = 0.5;
    let targetRoll = 0;
    let targetPitch = 0;
    let targetYaw = 0;
    let targetMouthOpen = 0;
    let targetLeftBlink = 0;
    let targetRightBlink = 0;
    let faceDetected = false;

    // 1. Audio analysis for immediate lip-sync
    let voiceVol = 0;
    if (this.analyser && this.audioDataArray) {
      this.analyser.getByteFrequencyData(this.audioDataArray);
      let sum = 0;
      // Focus on vocal range (bins 2 through 24 approx 200Hz - 3500Hz)
      const count = Math.min(this.audioDataArray.length, 30);
      for (let i = 2; i < count; i++) {
        sum += this.audioDataArray[i];
      }
      const avg = sum / (count - 2);
      voiceVol = Math.min(1, Math.max(0, (avg - 15) / 75));
    }
    this.currentAudioVol += (voiceVol - this.currentAudioVol) * 0.4;

    // 2. Video Analysis
    const v = this.video;
    if (v && v.readyState >= 2 && v.videoWidth > 0 && !v.paused) {
      // Draw small frame to offscreen canvas for fast CV analysis
      if (this.offscreenCtx) {
        const cw = this.offscreenCanvas.width;
        const ch = this.offscreenCanvas.height;
        this.offscreenCtx.drawImage(v, 0, 0, cw, ch);
        const imgData = this.offscreenCtx.getImageData(0, 0, cw, ch);
        const pixels = imgData.data;

        // Optical skin-tone & face center clustering
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        let minX = cw;
        let maxX = 0;
        let minY = ch;
        let maxY = 0;

        let leftSideMass = 0;
        let rightSideMass = 0;
        let mouthRegionLuminance = 0;
        let mouthPixelsCount = 0;

        for (let y = 6; y < ch - 6; y++) {
          for (let x = 6; x < cw - 6; x++) {
            const idx = (y * cw + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];

            // Skin tone color boundary test
            const isSkin =
              r > 60 &&
              g > 40 &&
              b > 20 &&
              r > g &&
              r > b &&
              r - g >= 10 &&
              Math.abs(r - g) > 8;

            if (isSkin) {
              totalWeight++;
              weightedX += x;
              weightedY += y;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;

              if (x < cw / 2) leftSideMass++;
              else rightSideMass++;

              // Mouth region check (lower third of face)
              if (y > ch * 0.55 && y < ch * 0.85 && x > cw * 0.35 && x < cw * 0.65) {
                mouthRegionLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
                mouthPixelsCount++;
              }
            }
          }
        }

        if (totalWeight > 80) {
          faceDetected = true;
          targetX = weightedX / totalWeight / cw;
          targetY = (weightedY / totalWeight / ch) * 0.95;
          targetW = Math.max(0.28, Math.min(0.65, (maxX - minX) / cw * 1.3));
          targetH = Math.max(0.35, Math.min(0.75, (maxY - minY) / ch * 1.3));

          // Head yaw estimation based on lateral mass balance
          const diff = (rightSideMass - leftSideMass) / Math.max(1, totalWeight);
          targetYaw = Math.max(-0.4, Math.min(0.4, diff * 1.4));

          // Head roll estimation based on centroid offset
          targetRoll = Math.max(-0.35, Math.min(0.35, (targetX - 0.5) * -0.6));

          // Optical mouth opening ratio
          if (mouthPixelsCount > 10) {
            const avgMouthLum = mouthRegionLuminance / mouthPixelsCount;
            // When mouth opens, dark oral cavity lowers average luminance
            const opticalOpen = Math.max(0, Math.min(1, (115 - avgMouthLum) / 50));
            targetMouthOpen = Math.max(targetMouthOpen, opticalOpen * 0.85);
          }
        }
      }
    } else {
      // Subtle idle breathing simulation when camera is pending or muted
      const t = Date.now() * 0.0018;
      targetX = 0.5 + Math.sin(t * 0.7) * 0.02;
      targetY = 0.44 + Math.cos(t * 1.1) * 0.015;
      targetRoll = Math.sin(t * 0.5) * 0.04;
      targetYaw = Math.cos(t * 0.6) * 0.05;
      targetPitch = Math.sin(t * 0.9) * 0.03;
      faceDetected = true;
    }

    // Combine audio voice volume into mouth opening for 100% responsive talking
    if (this.currentAudioVol > 0.05) {
      targetMouthOpen = Math.max(targetMouthOpen, this.currentAudioVol * 1.25);
      targetMouthOpen = Math.min(1, targetMouthOpen);
    }

    // Natural blinking mechanism (every ~3.5 to 4.5 seconds)
    const now = Date.now();
    if (!this.isBlinking && now - this.lastBlinkTime > 3800 + Math.random() * 800) {
      this.isBlinking = true;
      this.lastBlinkTime = now;
    }
    if (this.isBlinking) {
      const elapsed = now - this.lastBlinkTime;
      if (elapsed < this.blinkDuration) {
        const progress = Math.sin((elapsed / this.blinkDuration) * Math.PI);
        targetLeftBlink = Math.max(targetLeftBlink, progress);
        targetRightBlink = Math.max(targetRightBlink, progress);
      } else {
        this.isBlinking = false;
      }
    }

    // Smooth values using LERP (Low-Pass Filter)
    const posLerp = 0.22;
    const rotLerp = 0.20;
    const mouthLerp = 0.38;
    const blinkLerp = 0.45;

    this.currentX += (targetX - this.currentX) * posLerp;
    this.currentY += (targetY - this.currentY) * posLerp;
    this.currentW += (targetW - this.currentW) * posLerp;
    this.currentH += (targetH - this.currentH) * posLerp;
    this.currentRoll += (targetRoll - this.currentRoll) * rotLerp;
    this.currentPitch += (targetPitch - this.currentPitch) * rotLerp;
    this.currentYaw += (targetYaw - this.currentYaw) * rotLerp;
    this.currentMouthOpen += (targetMouthOpen - this.currentMouthOpen) * mouthLerp;
    this.currentLeftBlink += (targetLeftBlink - this.currentLeftBlink) * blinkLerp;
    this.currentRightBlink += (targetRightBlink - this.currentRightBlink) * blinkLerp;

    const isTalking = this.currentMouthOpen > 0.15 || this.currentAudioVol > 0.08;

    const state: FaceTrackingState = {
      faceDetected,
      x: this.currentX,
      y: this.currentY,
      width: this.currentW,
      height: this.currentH,
      roll: this.currentRoll,
      pitch: this.currentPitch,
      yaw: this.currentYaw,
      mouthOpen: Math.max(0, Math.min(1, this.currentMouthOpen)),
      mouthSmile: this.currentSmile,
      leftEyeBlink: Math.max(0, Math.min(1, this.currentLeftBlink)),
      rightEyeBlink: Math.max(0, Math.min(1, this.currentRightBlink)),
      isTalking,
      audioVolume: this.currentAudioVol,
    };

    if (this.onTrackCallback) {
      this.onTrackCallback(state);
    }
  }
}
