import React, { useEffect, useRef, useState } from 'react';
import { AvatarMaskId, FaceTrackingState } from '../types';
import { FaceTrackingEngine } from '../services/faceTrackingEngine';
import { TRENDING_AVATARS } from '../data/avatarPresets';

interface AvatarFaceMaskCanvasProps {
  avatarId: AvatarMaskId;
  videoElement: HTMLVideoElement | null;
  audioStream?: MediaStream | null;
  mode?: 'mask_overlay' | 'full_avatar'; // overlay on real webcam, or full studio privacy
  mirror?: boolean;
  className?: string;
  showHUD?: boolean;
}

export const AvatarFaceMaskCanvas: React.FC<AvatarFaceMaskCanvasProps> = ({
  avatarId,
  videoElement,
  audioStream,
  mode = 'full_avatar', // Default to Full Studio Privacy
  mirror = false,
  className = 'absolute inset-0 w-full h-full pointer-events-none',
  showHUD = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FaceTrackingEngine | null>(null);
  const [trackingState, setTrackingState] = useState<FaceTrackingState>({
    faceDetected: true,
    x: 0.5,
    y: 0.45,
    width: 0.4,
    height: 0.5,
    roll: 0,
    pitch: 0,
    yaw: 0,
    mouthOpen: 0,
    mouthSmile: 0.2,
    leftEyeBlink: 0,
    rightEyeBlink: 0,
    isTalking: false,
    audioVolume: 0,
  });

  const preset = TRENDING_AVATARS.find((a) => a.id === avatarId) || TRENDING_AVATARS[0];

  useEffect(() => {
    const engine = new FaceTrackingEngine();
    engineRef.current = engine;

    engine.setVideoElement(videoElement);
    if (audioStream) {
      engine.setAudioStream(audioStream);
    }

    engine.start((state) => {
      setTrackingState(state);
      drawAvatar(state);
    });

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [avatarId, mode, mirror]);

  // Keep engine video & audio stream in sync if they change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVideoElement(videoElement);
    }
  }, [videoElement]);

  useEffect(() => {
    if (engineRef.current && audioStream) {
      engineRef.current.setAudioStream(audioStream);
    }
  }, [audioStream]);

  // Main Canvas Rendering Loop
  const drawAvatar = (state: FaceTrackingState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const width = canvas.clientWidth || 360;
    const height = canvas.clientHeight || 480;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // If Full Privacy Avatar Mode: Draw high-tech privacy studio background & body
    if (mode === 'full_avatar') {
      drawFullStudioBackground(ctx, width, height, state);
    }

    ctx.save();

    // Mirror horizontal if requested
    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Calculate face center in canvas coordinates
    const faceCX = state.x * width;
    const faceCY = state.y * height;
    const faceSize = Math.max(width, height) * (state.width * 0.95);

    // Apply Head Pose transformations (Center, Roll tilt, Yaw shift)
    ctx.translate(faceCX, faceCY);
    ctx.rotate(state.roll);

    // Subtle 3D perspective skew based on yaw & pitch
    ctx.transform(1, state.pitch * 0.15, state.yaw * 0.15, 1, 0, 0);

    // Render the specific chosen avatar
    switch (avatarId) {
      case 'fox_cyber':
        drawCyberFox(ctx, faceSize, state, preset);
        break;
      case 'panda_kawaii':
        drawKawaiiPanda(ctx, faceSize, state, preset);
        break;
      case 'robot_mecha':
        drawMechaRobot(ctx, faceSize, state, preset);
        break;
      case 'tiger_fire':
        drawFireTiger(ctx, faceSize, state, preset);
        break;
      case 'cat_cool':
        drawCoolCat(ctx, faceSize, state, preset);
        break;
      case 'ape_crypto':
        drawCryptoApe(ctx, faceSize, state, preset);
        break;
      case 'alien_galaxy':
        drawGalaxyAlien(ctx, faceSize, state, preset);
        break;
      case 'ninja_oni':
        drawNinjaOni(ctx, faceSize, state, preset);
        break;
      case 'lion_golden':
        drawGoldenLion(ctx, faceSize, state, preset);
        break;
      case 'bear_anime':
        drawAnimeBear(ctx, faceSize, state, preset);
        break;
      default:
        // Universal Animal Face Emoji Avatar
        drawAnimalEmojiAvatar(ctx, faceSize, state, preset);
        break;
    }

    ctx.restore();
  };

  // ==========================================
  // UNIVERSAL ANIMAL FACE EMOJI AVATAR
  // ==========================================
  const drawAnimalEmojiAvatar = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Glowing aura behind animal face
    ctx.save();
    const glowGrad = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 1.3);
    glowGrad.addColorStop(0, p.primaryColor ? `${p.primaryColor}55` : 'rgba(168, 85, 247, 0.3)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle breathing / talking squash & stretch
    ctx.save();
    const talkBounce = state.isTalking ? Math.sin(Date.now() * 0.02) * (0.04 + state.audioVolume * 0.05) : 0;
    const mouthScaleY = 1 + (state.mouthOpen * 0.1) + talkBounce;
    const mouthScaleX = 1 - (state.mouthOpen * 0.03);
    ctx.scale(mouthScaleX, mouthScaleY);

    // High-resolution animal face emoji rendering
    const fontSize = Math.round(s * 0.95);
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji || '🦊', 0, 0);

    // Interactive blinking overlays
    if (state.leftEyeBlink > 0.45 || state.rightEyeBlink > 0.45) {
      ctx.save();
      ctx.strokeStyle = '#1E1B4B';
      ctx.lineWidth = Math.max(3.5, s * 0.04);
      ctx.lineCap = 'round';

      const eyeOffsetY = -r * 0.12;
      const eyeSpacingX = r * 0.34;

      if (state.leftEyeBlink > 0.45) {
        ctx.beginPath();
        ctx.arc(-eyeSpacingX, eyeOffsetY, r * 0.14, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      if (state.rightEyeBlink > 0.45) {
        ctx.beginPath();
        ctx.arc(eyeSpacingX, eyeOffsetY, r * 0.14, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  };

  // ==========================================
  // FULL PRIVACY BACKGROUND & BUST
  // ==========================================
  const drawFullStudioBackground = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    state: FaceTrackingState
  ) => {
    // Elegant dark-room studio backdrop
    const grad = ctx.createRadialGradient(w / 2, h * 0.4, 20, w / 2, h / 2, w);
    grad.addColorStop(0, '#1E1B4B');
    grad.addColorStop(0.5, '#0F172A');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle studio background rim lights
    ctx.save();
    ctx.fillStyle = preset.glowColor || 'rgba(168, 85, 247, 0.4)';
    ctx.filter = 'blur(40px)';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.45, w * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Stylized Cyber Virtual Shoulders / Torso
    ctx.save();
    const shoulderCX = w / 2 + (state.x - 0.5) * 40;
    const shoulderCY = h * 0.82;
    const shoulderGrad = ctx.createLinearGradient(0, shoulderCY - 50, 0, h);
    shoulderGrad.addColorStop(0, '#1E293B');
    shoulderGrad.addColorStop(1, '#0F172A');

    ctx.fillStyle = shoulderGrad;
    ctx.beginPath();
    ctx.moveTo(shoulderCX - w * 0.45, h);
    ctx.quadraticCurveTo(shoulderCX - w * 0.35, shoulderCY, shoulderCX - w * 0.12, shoulderCY - 15);
    ctx.quadraticCurveTo(shoulderCX, shoulderCY + 20, shoulderCX + w * 0.12, shoulderCY - 15);
    ctx.quadraticCurveTo(shoulderCX + w * 0.35, shoulderCY, shoulderCX + w * 0.45, h);
    ctx.closePath();
    ctx.fill();

    // Collar / Hoodie neon trim
    ctx.strokeStyle = preset.accentColor || preset.primaryColor || '#A855F7';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  };

  // ==========================================
  // 1. CYBERPUNK KITSUNE (CYBER FOX)
  // ==========================================
  const drawCyberFox = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Glowing Neon Ears
    [-1, 1].forEach((dir) => {
      ctx.save();
      ctx.translate(dir * r * 0.65, -r * 0.7);
      ctx.rotate(dir * 0.3 + (dir * state.yaw * 0.2));

      // Outer Ear
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(-r * 0.28, r * 0.2);
      ctx.lineTo(0, -r * 0.65);
      ctx.lineTo(r * 0.28, r * 0.2);
      ctx.closePath();
      ctx.fill();

      // Inner Cyber Circuit Ear
      ctx.fillStyle = '#06B6D4';
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-r * 0.14, r * 0.15);
      ctx.lineTo(0, -r * 0.48);
      ctx.lineTo(r * 0.14, r * 0.15);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // Fox Head Base Mask
    const headGrad = ctx.createLinearGradient(0, -r * 0.8, 0, r * 0.9);
    headGrad.addColorStop(0, '#F97316');
    headGrad.addColorStop(0.65, '#EA580C');
    headGrad.addColorStop(1, '#FFFFFF');

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.75);
    ctx.quadraticCurveTo(r * 0.88, -r * 0.3, r * 0.75, r * 0.3);
    ctx.quadraticCurveTo(r * 0.45, r * 0.9, 0, r * 0.95);
    ctx.quadraticCurveTo(-r * 0.45, r * 0.9, -r * 0.75, r * 0.3);
    ctx.quadraticCurveTo(-r * 0.88, -r * 0.3, 0, -r * 0.75);
    ctx.closePath();
    ctx.fill();

    // White Fox Cheeks Tuft
    ctx.fillStyle = '#FFFFFF';
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.4, r * 0.2);
      ctx.lineTo(dir * r * 0.85, r * 0.38);
      ctx.lineTo(dir * r * 0.5, r * 0.55);
      ctx.lineTo(dir * r * 0.8, r * 0.65);
      ctx.lineTo(dir * r * 0.3, r * 0.8);
      ctx.closePath();
      ctx.fill();
    });

    // Cyber Visor / Ocular Glasses
    ctx.save();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.85)';
    ctx.shadowColor = '#06B6D4';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.roundRect(-r * 0.68, -r * 0.28, r * 1.36, r * 0.36, 10);
    ctx.fill();

    // Pulsing digital HUD reticle on visor
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-r * 0.28, -r * 0.1, r * 0.09, 0, Math.PI * 2);
    ctx.arc(r * 0.28, -r * 0.1, r * 0.09, 0, Math.PI * 2);
    ctx.stroke();

    // Blinking eye pupils behind cyber visor
    [-1, 1].forEach((dir) => {
      const blink = dir === -1 ? state.leftEyeBlink : state.rightEyeBlink;
      const eyeOpenHeight = Math.max(2, (1 - blink) * r * 0.07);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(dir * r * 0.28, -r * 0.1, r * 0.05, eyeOpenHeight, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Nose
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.48, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic Talking Mouth
    drawMouth(ctx, r, state, '#1E293B', '#F43F5E');

    // Cyber Whiskers
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 2;
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.3, r * 0.48);
      ctx.lineTo(dir * r * 0.85, r * 0.42);
      ctx.moveTo(dir * r * 0.3, r * 0.58);
      ctx.lineTo(dir * r * 0.85, r * 0.62);
      ctx.stroke();
    });
  };

  // ==========================================
  // 2. KAWAII PANDA
  // ==========================================
  const drawKawaiiPanda = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Round Black Panda Ears
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.arc(dir * r * 0.65, -r * 0.62, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    });

    // White Fluffy Head
    ctx.fillStyle = '#FAFAFA';
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Black Eye Patches (Tilted slightly inward)
    [-1, 1].forEach((dir) => {
      ctx.save();
      ctx.translate(dir * r * 0.32, -r * 0.06);
      ctx.rotate(dir * 0.2);
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.21, r * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sparkling Anime Eyes with Blinking
      const blink = dir === -1 ? state.leftEyeBlink : state.rightEyeBlink;
      const eyeH = Math.max(1, (1 - blink) * r * 0.12);

      if (eyeH > 2) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-dir * 2, -r * 0.04, r * 0.07, 0, Math.PI * 2);
        ctx.arc(dir * 4, r * 0.05, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Closed / Wink eye curve
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.1, 0, Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Cute Pink Blushing Cheeks
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
      ctx.beginPath();
      ctx.ellipse(dir * r * 0.48, r * 0.24, r * 0.14, r * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Cute Nose
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.16, r * 0.09, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bamboo Leaf in Mouth
    ctx.save();
    ctx.translate(r * 0.22, r * 0.3);
    ctx.rotate(0.3 + state.mouthOpen * 0.2);
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.22, r * 0.06, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Talking Mouth
    drawMouth(ctx, r, state, '#18181B', '#FB7185');
  };

  // ==========================================
  // 3. MECHA ANDROID BOT
  // ==========================================
  const drawMechaRobot = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Dual Antennas with glowing signal LED
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#475569';
      ctx.fillRect(dir * r * 0.65 - 4, -r * 0.85, 8, r * 0.45);

      ctx.fillStyle = state.isTalking ? '#38BDF8' : '#3B82F6';
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = state.isTalking ? 18 : 8;
      ctx.beginPath();
      ctx.arc(dir * r * 0.65, -r * 0.88, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Titanium Helmet Shell
    const botGrad = ctx.createLinearGradient(0, -r * 0.8, 0, r * 0.9);
    botGrad.addColorStop(0, '#334155');
    botGrad.addColorStop(0.5, '#1E293B');
    botGrad.addColorStop(1, '#0F172A');

    ctx.fillStyle = botGrad;
    ctx.beginPath();
    ctx.roundRect(-r * 0.72, -r * 0.7, r * 1.44, r * 1.45, 24);
    ctx.fill();

    // Beveled Edge Trim
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 4;
    ctx.stroke();

    // High-Tech LED Digital Visor Screen
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(-r * 0.58, -r * 0.35, r * 1.16, r * 0.42, 14);
    ctx.fill();

    // Voice Waveform / Eye Equalizer on Visor
    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;

    const bars = 8;
    for (let i = 0; i < bars; i++) {
      const bx = -r * 0.45 + (i * r * 0.9) / (bars - 1);
      const wave = Math.sin(Date.now() * 0.01 + i) * (state.audioVolume * 22 + 5);
      ctx.beginPath();
      ctx.moveTo(bx, -r * 0.14 - wave);
      ctx.lineTo(bx, -r * 0.14 + wave);
      ctx.stroke();
    }
    ctx.restore();

    // Speaker Mouth Grille (Opens when speaking)
    const mouthW = r * 0.5;
    const mouthH = Math.max(8, state.mouthOpen * r * 0.28);
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.roundRect(-mouthW / 2, r * 0.28, mouthW, mouthH, 6);
    ctx.fill();

    ctx.fillStyle = state.isTalking ? '#06B6D4' : '#64748B';
    ctx.shadowColor = state.isTalking ? '#06B6D4' : 'transparent';
    ctx.shadowBlur = 8;
    for (let x = -mouthW / 2 + 6; x < mouthW / 2 - 4; x += 10) {
      ctx.fillRect(x, r * 0.3, 4, mouthH - 4);
    }
    ctx.shadowBlur = 0;
  };

  // ==========================================
  // 4. FIERY CYBER TIGER
  // ==========================================
  const drawFireTiger = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Tiger Round Ears
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.arc(dir * r * 0.62, -r * 0.6, r * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // White inner ear patch
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(dir * r * 0.62, -r * 0.6, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    });

    // Tiger Head Face Base
    const tigerGrad = ctx.createLinearGradient(0, -r * 0.8, 0, r * 0.8);
    tigerGrad.addColorStop(0, '#EA580C');
    tigerGrad.addColorStop(0.7, '#F59E0B');
    tigerGrad.addColorStop(1, '#FFFFFF');

    ctx.fillStyle = tigerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.76, 0, Math.PI * 2);
    ctx.fill();

    // Fierce Black Stripes on Forehead and Cheeks
    ctx.fillStyle = '#18181B';
    // Forehead center crown stripe
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.68);
    ctx.lineTo(r * 0.12, -r * 0.35);
    ctx.lineTo(0, -r * 0.42);
    ctx.lineTo(-r * 0.12, -r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Cheek Stripes
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.72, -r * 0.15);
      ctx.lineTo(dir * r * 0.42, -r * 0.08);
      ctx.lineTo(dir * r * 0.7, 0);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(dir * r * 0.7, r * 0.12);
      ctx.lineTo(dir * r * 0.44, r * 0.18);
      ctx.lineTo(dir * r * 0.65, r * 0.26);
      ctx.closePath();
      ctx.fill();
    });

    // Amber Piercing Feline Eyes
    [-1, 1].forEach((dir) => {
      const blink = dir === -1 ? state.leftEyeBlink : state.rightEyeBlink;
      const eyeH = Math.max(1, (1 - blink) * r * 0.14);

      ctx.save();
      ctx.translate(dir * r * 0.32, -r * 0.08);
      ctx.fillStyle = '#F59E0B';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.18, eyeH, dir * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Slit Pupil
      if (eyeH > 3) {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.04, eyeH * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // White Muzzle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.28, r * 0.34, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.24);
    ctx.lineTo(r * 0.08, r * 0.15);
    ctx.lineTo(-r * 0.08, r * 0.15);
    ctx.closePath();
    ctx.fill();

    // Roaring Mouth with Fangs
    drawMouthWithFangs(ctx, r, state);
  };

  // ==========================================
  // 5. NEON CHILL CAT
  // ==========================================
  const drawCoolCat = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Pointy Cat Ears with Neon Glow
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#DB2777';
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.3, -r * 0.55);
      ctx.lineTo(dir * r * 0.72, -r * 0.85);
      ctx.lineTo(dir * r * 0.75, -r * 0.25);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.4, -r * 0.5);
      ctx.lineTo(dir * r * 0.68, -r * 0.72);
      ctx.lineTo(dir * r * 0.68, -r * 0.3);
      ctx.closePath();
      ctx.fill();
    });

    // Cat Head
    ctx.fillStyle = '#9D174D';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.75, r * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trendy VIP Dark Sunglasses with Neon Reflection
    ctx.save();
    ctx.fillStyle = '#09090B';
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#EC4899';
    ctx.shadowBlur = 12;

    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.roundRect(dir * r * 0.38 - r * 0.25, -r * 0.22, r * 0.5, r * 0.3, 10);
      ctx.fill();
      ctx.stroke();

      // Cyber reflection slash
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.38 - r * 0.15, -r * 0.18);
      ctx.lineTo(dir * r * 0.38 + r * 0.15, -r * 0.02);
      ctx.stroke();
    });

    // Bridge connecting sunglasses
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.15, -r * 0.1);
    ctx.lineTo(r * 0.15, -r * 0.1);
    ctx.stroke();
    ctx.restore();

    // Pink Button Nose
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.22, r * 0.07, r * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Talking Mouth
    drawMouth(ctx, r, state, '#500724', '#FB7185');

    // Neon Whiskers
    ctx.strokeStyle = '#F472B6';
    ctx.lineWidth = 2;
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.25, r * 0.25);
      ctx.lineTo(dir * r * 0.75, r * 0.2);
      ctx.moveTo(dir * r * 0.25, r * 0.32);
      ctx.lineTo(dir * r * 0.75, r * 0.35);
      ctx.stroke();
    });
  };

  // ==========================================
  // 6. CRYPTO BORED APE
  // ==========================================
  const drawCryptoApe = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Big Ape Round Ears
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(dir * r * 0.75, 0, r * 0.26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.arc(dir * r * 0.75, 0, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    });

    // Brown Fur Head
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Cool Street Beanie / Cap
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.5, r * 0.65, r * 0.32, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#0369A1';
    ctx.fillRect(-r * 0.65, -r * 0.5, r * 1.3, r * 0.1);

    // Tan Ape Eye Sockets & Muzzle
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.3, r * 0.52, r * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bored Eyes / Droopy Eyelids
    [-1, 1].forEach((dir) => {
      const blink = dir === -1 ? state.leftEyeBlink : state.rightEyeBlink;
      const eyeH = Math.max(1, (1 - blink) * r * 0.14);

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(dir * r * 0.28, -r * 0.08, r * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Pupil looking around
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.arc(dir * r * 0.28 + state.yaw * 10, -r * 0.08, r * 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Heavy Droopy Bored Eyelids
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(dir * r * 0.28, -r * 0.08, r * 0.17, Math.PI, Math.PI * 2 * (0.5 + blink * 0.5));
      ctx.fill();
    });

    // Two Nostrils
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.ellipse(dir * r * 0.1, r * 0.16, r * 0.05, r * 0.08, dir * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Wide Ape Smirk / Animated Talking Mouth
    const mouthW = r * 0.65;
    const mouthH = Math.max(6, state.mouthOpen * r * 0.35);
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.roundRect(-mouthW / 2, r * 0.35, mouthW, mouthH, 12);
    ctx.fill();

    // Shiny Gold Tooth
    if (state.mouthOpen > 0.1) {
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(r * 0.1, r * 0.36, r * 0.09, r * 0.08);
    }
  };

  // ==========================================
  // 7. GALAXY COSMIC ALIEN
  // ==========================================
  const drawGalaxyAlien = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Glowing Cosmic Antenna Orbs
    [-1, 1].forEach((dir) => {
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.2, -r * 0.65);
      ctx.quadraticCurveTo(dir * r * 0.5, -r * 0.9, dir * r * 0.45, -r * 1.05);
      ctx.stroke();

      ctx.fillStyle = state.isTalking ? '#22D3EE' : '#C084FC';
      ctx.shadowColor = '#22D3EE';
      ctx.shadowBlur = state.isTalking ? 20 : 10;
      ctx.beginPath();
      ctx.arc(dir * r * 0.45, -r * 1.05, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Inverted Pear Cosmic Alien Head
    const cosmicGrad = ctx.createRadialGradient(0, -r * 0.2, 10, 0, 0, r * 0.9);
    cosmicGrad.addColorStop(0, '#A855F7');
    cosmicGrad.addColorStop(0.7, '#6B21A8');
    cosmicGrad.addColorStop(1, '#3B0764');

    ctx.fillStyle = cosmicGrad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.75);
    ctx.bezierCurveTo(r * 0.85, -r * 0.75, r * 0.85, 0, r * 0.3, r * 0.75);
    ctx.bezierCurveTo(0, r * 0.95, 0, r * 0.95, -r * 0.3, r * 0.75);
    ctx.bezierCurveTo(-r * 0.85, 0, -r * 0.85, -r * 0.75, 0, -r * 0.75);
    ctx.fill();

    // Huge Glossy Black Cosmic Eyes (Tilted)
    [-1, 1].forEach((dir) => {
      ctx.save();
      ctx.translate(dir * r * 0.35, -r * 0.1);
      ctx.rotate(dir * 0.35);

      const blink = dir === -1 ? state.leftEyeBlink : state.rightEyeBlink;
      const eyeH = Math.max(2, (1 - blink) * r * 0.35);

      ctx.fillStyle = '#09090B';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.22, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Starlight reflections inside alien eye
      if (eyeH > 8) {
        ctx.fillStyle = '#22D3EE';
        ctx.beginPath();
        ctx.arc(-dir * 4, -r * 0.08, r * 0.06, 0, Math.PI * 2);
        ctx.arc(dir * 6, r * 0.08, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Tiny alien slit mouth that lights up when speaking
    const mouthW = r * 0.28;
    const mouthH = Math.max(4, state.mouthOpen * r * 0.2);
    ctx.fillStyle = state.isTalking ? '#22D3EE' : '#1E1B4B';
    ctx.shadowColor = state.isTalking ? '#22D3EE' : 'transparent';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.48, mouthW / 2, mouthH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  // ==========================================
  // 8. SHADOW ONI MASK (NINJA ONI)
  // ==========================================
  const drawNinjaOni = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Crimson Demon Horns
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#DC2626';
      ctx.shadowColor = '#DC2626';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.35, -r * 0.5);
      ctx.quadraticCurveTo(dir * r * 0.85, -r * 0.85, dir * r * 0.65, -r * 1.05);
      ctx.quadraticCurveTo(dir * r * 0.45, -r * 0.8, dir * r * 0.2, -r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Dark Ninja Mask Base
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(r * 0.75, -r * 0.2);
    ctx.lineTo(r * 0.55, r * 0.7);
    ctx.lineTo(0, r * 0.95);
    ctx.lineTo(-r * 0.55, r * 0.7);
    ctx.lineTo(-r * 0.75, -r * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Menacing Glowing Crimson Slit Eyes
    [-1, 1].forEach((dir) => {
      const blink = dir === -1 ? state.leftEyeBlink : state.rightEyeBlink;
      const eyeH = Math.max(1, (1 - blink) * r * 0.1);

      ctx.save();
      ctx.translate(dir * r * 0.32, -r * 0.12);
      ctx.rotate(dir * 0.25);
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.22, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Oni Fang Teeth Grille
    const mouthW = r * 0.5;
    const mouthH = Math.max(8, state.mouthOpen * r * 0.28);
    ctx.fillStyle = '#09090B';
    ctx.beginPath();
    ctx.roundRect(-mouthW / 2, r * 0.32, mouthW, mouthH, 6);
    ctx.fill();

    // Sharp White Fangs
    ctx.fillStyle = '#FFFFFF';
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.18, r * 0.32);
      ctx.lineTo(dir * r * 0.12, r * 0.44);
      ctx.lineTo(dir * r * 0.06, r * 0.32);
      ctx.closePath();
      ctx.fill();
    });
  };

  // ==========================================
  // 9. GOLDEN ROYAL LION
  // ==========================================
  const drawGoldenLion = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Majestic Sprawling Lion Mane (Tufts radiating outward)
    ctx.fillStyle = '#B45309';
    const maneTufts = 16;
    for (let i = 0; i < maneTufts; i++) {
      const angle = (i * Math.PI * 2) / maneTufts;
      const mx = Math.cos(angle) * r * 0.85;
      const my = Math.sin(angle) * r * 0.85;
      ctx.beginPath();
      ctx.arc(mx, my, r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }

    // Golden Royal Crown
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = '#F59E0B';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.65);
    ctx.lineTo(-r * 0.35, -r * 0.95);
    ctx.lineTo(-r * 0.12, -r * 0.72);
    ctx.lineTo(0, -r * 1.05);
    ctx.lineTo(r * 0.12, -r * 0.72);
    ctx.lineTo(r * 0.35, -r * 0.95);
    ctx.lineTo(r * 0.45, -r * 0.65);
    ctx.closePath();
    ctx.fill();

    // Emerald Crown Gem
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(0, -r * 0.8, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Lion Face Base
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.68, 0, Math.PI * 2);
    ctx.fill();

    // Regal Amber Eyes
    [-1, 1].forEach((dir) => {
      const blink = dir === -1 ? state.leftEyeBlink : state.rightEyeBlink;
      const eyeH = Math.max(1, (1 - blink) * r * 0.12);

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(dir * r * 0.28, -r * 0.08, r * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.arc(dir * r * 0.28, -r * 0.08, eyeH * 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Muzzle & Whiskers
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.26, r * 0.34, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.14, r * 0.1, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // Talking Roar Mouth
    drawMouth(ctx, r, state, '#451A03', '#DC2626');
  };

  // ==========================================
  // 10. ANIME CHIBI BEAR
  // ==========================================
  const drawAnimeBear = (
    ctx: CanvasRenderingContext2D,
    s: number,
    state: FaceTrackingState,
    p: typeof preset
  ) => {
    const r = s * 0.46;

    // Fluffy Round Bear Ears
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.arc(dir * r * 0.65, -r * 0.62, r * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Pink Inner Ear
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(dir * r * 0.65, -r * 0.62, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    });

    // Head Base
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // Heart Shaped Blush Cheeks
    [-1, 1].forEach((dir) => {
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(dir * r * 0.48, r * 0.18, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    });

    // Sparkling Anime Eyes
    [-1, 1].forEach((dir) => {
      const blink = dir === -1 ? state.leftEyeBlink : state.rightEyeBlink;
      const eyeH = Math.max(1, (1 - blink) * r * 0.14);

      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.ellipse(dir * r * 0.32, -r * 0.06, r * 0.14, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Star sparkle highlight
      if (eyeH > 3) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(dir * r * 0.32 - 2, -r * 0.09, r * 0.06, 0, Math.PI * 2);
        ctx.arc(dir * r * 0.32 + 4, -r * 0.03, r * 0.03, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Cream Muzzle
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.22, r * 0.28, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.14, r * 0.08, r * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Talking Mouth
    drawMouth(ctx, r, state, '#451A03', '#FB7185');
  };

  // ==========================================
  // HELPER MOUTH RENDERERS
  // ==========================================
  const drawMouth = (
    ctx: CanvasRenderingContext2D,
    r: number,
    state: FaceTrackingState,
    cavityColor: string,
    tongueColor: string
  ) => {
    const mouthW = r * 0.35;
    const openH = Math.max(4, state.mouthOpen * r * 0.38);

    ctx.save();
    ctx.translate(0, r * 0.35);

    if (state.mouthOpen < 0.08) {
      // Gentle closed smile line
      ctx.strokeStyle = cavityColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.15, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else {
      // Dynamic open talking mouth with tongue
      ctx.fillStyle = cavityColor;
      ctx.beginPath();
      ctx.ellipse(0, openH / 2, mouthW / 2, openH / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pink Tongue
      ctx.fillStyle = tongueColor;
      ctx.beginPath();
      ctx.ellipse(0, openH * 0.7, mouthW * 0.35, openH * 0.3, 0, 0, Math.PI);
      ctx.fill();

      // Top White Teeth
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(-mouthW * 0.35, 0, mouthW * 0.7, openH * 0.25, 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawMouthWithFangs = (
    ctx: CanvasRenderingContext2D,
    r: number,
    state: FaceTrackingState
  ) => {
    const mouthW = r * 0.45;
    const openH = Math.max(6, state.mouthOpen * r * 0.42);

    ctx.save();
    ctx.translate(0, r * 0.36);

    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.ellipse(0, openH / 2, mouthW / 2, openH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tongue
    if (state.mouthOpen > 0.15) {
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.ellipse(0, openH * 0.75, mouthW * 0.35, openH * 0.28, 0, 0, Math.PI);
      ctx.fill();
    }

    // Top Sharp Tiger Fangs
    ctx.fillStyle = '#FFFFFF';
    [-1, 1].forEach((dir) => {
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.14, 0);
      ctx.lineTo(dir * r * 0.1, openH * 0.5 + 4);
      ctx.lineTo(dir * r * 0.06, 0);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas ref={canvasRef} className={className} />

      {/* Optional Tracking HUD badge */}
      {showHUD && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-white border border-white/20">
          <span
            className={`w-2 h-2 rounded-full ${
              trackingState.isTalking ? 'bg-emerald-400 animate-pulse' : 'bg-purple-400'
            }`}
          />
          <span className="font-semibold">{preset.emoji} {preset.name}</span>
          {trackingState.isTalking && (
            <span className="text-[9px] text-emerald-300 font-mono">SPEAKING</span>
          )}
        </div>
      )}
    </div>
  );
};
