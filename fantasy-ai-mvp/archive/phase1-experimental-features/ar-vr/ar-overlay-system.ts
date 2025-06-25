import { z } from "zod";

export const ARModeSchema = z.enum([
  "game_watch",
  "player_stats", 
  "lineup_builder",
  "trade_analyzer",
  "live_scoring",
  "stadium_view"
]);

export const AROverlaySchema = z.object({
  id: z.string(),
  type: z.enum(["player_card", "stat_bubble", "projection_chart", "alert", "lineup_suggestion"]),
  position: z.object({
    x: z.number(), // Screen percentage 0-1
    y: z.number(), // Screen percentage 0-1
    z: z.number(), // Depth/distance
  }),
  content: z.record(z.any()),
  duration: z.number().optional(), // Auto-hide after ms
  interactive: z.boolean().default(false),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export const ARSessionSchema = z.object({
  userId: z.string(),
  mode: ARModeSchema,
  startTime: z.date(),
  endTime: z.date().optional(),
  overlays: z.array(AROverlaySchema),
  interactions: z.array(z.object({
    timestamp: z.date(),
    type: z.string(),
    data: z.record(z.any()),
  })),
});

export type ARMode = z.infer<typeof ARModeSchema>;
export type AROverlay = z.infer<typeof AROverlaySchema>;
export type ARSession = z.infer<typeof ARSessionSchema>;

export class AROverlaySystem {
  private mediaStream: MediaStream | null = null;
  private arSession: ARSession | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private overlays: Map<string, AROverlay> = new Map();
  private animationFrame: number | null = null;

  // WebXR compatibility
  private xrSession: XRSession | null = null;
  private isWebXRSupported = false;

  constructor() {
    this.checkWebXRSupport();
  }

  private async checkWebXRSupport(): Promise<void> {
    if ('xr' in navigator) {
      try {
        this.isWebXRSupported = await (navigator as any).xr.isSessionSupported('immersive-ar');
      } catch (error) {
        console.log("WebXR AR not supported:", error);
        this.isWebXRSupported = false;
      }
    }
  }

  async initializeCamera(): Promise<boolean> {
    try {
      const constraints = {
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      return true;
    } catch (error) {
      console.error("Camera initialization failed:", error);
      return false;
    }
  }

  async startARSession(userId: string, mode: ARMode): Promise<boolean> {
    if (!this.mediaStream) {
      const cameraReady = await this.initializeCamera();
      if (!cameraReady) return false;
    }

    this.arSession = {
      userId,
      mode,
      startTime: new Date(),
      overlays: [],
      interactions: [],
    };

    // Try WebXR first, fall back to camera overlay
    if (this.isWebXRSupported) {
      return this.startWebXRSession();
    } else {
      return this.startCameraOverlaySession();
    }
  }

  private async startWebXRSession(): Promise<boolean> {
    try {
      const xr = (navigator as any).xr;
      this.xrSession = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['dom-overlay'],
      });

      this.xrSession.addEventListener('end', () => {
        this.endARSession();
      });

      return true;
    } catch (error) {
      console.error("WebXR session failed:", error);
      return this.startCameraOverlaySession();
    }
  }

  private startCameraOverlaySession(): boolean {
    // Create canvas overlay system
    this.setupCanvasOverlay();
    this.startRenderLoop();
    return true;
  }

  private setupCanvasOverlay(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1000';

    this.context = this.canvas.getContext('2d');
    
    // Resize canvas to match device pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * pixelRatio;
    this.canvas.height = window.innerHeight * pixelRatio;
    this.context?.scale(pixelRatio, pixelRatio);

    document.body.appendChild(this.canvas);
  }

  private startRenderLoop(): void {
    const render = () => {
      this.renderOverlays();
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  }

  private renderOverlays(): void {
    if (!this.context || !this.canvas) return;

    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Sort overlays by priority and z-depth
    const sortedOverlays = Array.from(this.overlays.values()).sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.position.z - b.position.z;
    });

    // Render each overlay
    for (const overlay of sortedOverlays) {
      this.renderOverlay(overlay);
    }
  }

  private renderOverlay(overlay: AROverlay): void {
    if (!this.context) return;

    const x = overlay.position.x * window.innerWidth;
    const y = overlay.position.y * window.innerHeight;

    this.context.save();

    switch (overlay.type) {
      case "player_card":
        this.renderPlayerCard(x, y, overlay.content);
        break;
      case "stat_bubble":
        this.renderStatBubble(x, y, overlay.content);
        break;
      case "projection_chart":
        this.renderProjectionChart(x, y, overlay.content);
        break;
      case "alert":
        this.renderAlert(x, y, overlay.content);
        break;
      case "lineup_suggestion":
        this.renderLineupSuggestion(x, y, overlay.content);
        break;
    }

    this.context.restore();
  }

  private renderPlayerCard(x: number, y: number, content: any): void {
    if (!this.context) return;

    const width = 200;
    const height = 120;

    // Draw glassmorphic background
    this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.context.strokeStyle = 'rgba(0, 217, 255, 0.5)';
    this.context.lineWidth = 2;
    this.context.filter = 'blur(0px)';
    
    this.roundRect(x - width/2, y - height/2, width, height, 12);
    this.context.fill();
    this.context.stroke();

    // Player info
    this.context.fillStyle = '#ffffff';
    this.context.font = 'bold 16px system-ui';
    this.context.textAlign = 'center';
    this.context.fillText(content.name || 'Player', x, y - 30);

    this.context.font = '12px system-ui';
    this.context.fillStyle = '#00D9FF';
    this.context.fillText(`${content.position} | ${content.team}`, x, y - 10);

    this.context.fillStyle = '#ffffff';
    this.context.fillText(`${content.points || 0} pts`, x, y + 10);

    this.context.fillStyle = content.projectedPoints > content.points ? '#10B981' : '#EF4444';
    this.context.fillText(`Proj: ${content.projectedPoints || 0}`, x, y + 30);
  }

  private renderStatBubble(x: number, y: number, content: any): void {
    if (!this.context) return;

    const radius = 30;

    // Neon circle
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, 2 * Math.PI);
    this.context.fillStyle = 'rgba(147, 51, 234, 0.3)';
    this.context.fill();
    this.context.strokeStyle = '#9333EA';
    this.context.lineWidth = 2;
    this.context.stroke();

    // Stat value
    this.context.fillStyle = '#ffffff';
    this.context.font = 'bold 14px system-ui';
    this.context.textAlign = 'center';
    this.context.fillText(content.value || '0', x, y + 5);
  }

  private renderProjectionChart(x: number, y: number, content: any): void {
    if (!this.context) return;

    const width = 150;
    const height = 80;

    // Background
    this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.roundRect(x - width/2, y - height/2, width, height, 8);
    this.context.fill();

    // Simple bar chart
    if (content.data && Array.isArray(content.data)) {
      const barWidth = width / content.data.length;
      const maxValue = Math.max(...content.data);

      content.data.forEach((value: number, index: number) => {
        const barHeight = (value / maxValue) * (height - 20);
        const barX = x - width/2 + index * barWidth;
        const barY = y + height/2 - barHeight - 10;

        this.context!.fillStyle = '#00D9FF';
        this.context!.fillRect(barX + 2, barY, barWidth - 4, barHeight);
      });
    }
  }

  private renderAlert(x: number, y: number, content: any): void {
    if (!this.context) return;

    const width = 250;
    const height = 60;

    // Alert background
    this.context.fillStyle = 'rgba(239, 68, 68, 0.9)';
    this.context.strokeStyle = '#EF4444';
    this.context.lineWidth = 2;
    this.roundRect(x - width/2, y - height/2, width, height, 8);
    this.context.fill();
    this.context.stroke();

    // Alert text
    this.context.fillStyle = '#ffffff';
    this.context.font = 'bold 12px system-ui';
    this.context.textAlign = 'center';
    this.context.fillText(content.title || 'Alert', x, y - 10);

    this.context.font = '10px system-ui';
    this.context.fillText(content.message || '', x, y + 8);
  }

  private renderLineupSuggestion(x: number, y: number, content: any): void {
    if (!this.context) return;

    const width = 180;
    const height = 100;

    // Suggestion background
    this.context.fillStyle = 'rgba(16, 185, 129, 0.8)';
    this.context.strokeStyle = '#10B981';
    this.context.lineWidth = 2;
    this.roundRect(x - width/2, y - height/2, width, height, 8);
    this.context.fill();
    this.context.stroke();

    // Suggestion text
    this.context.fillStyle = '#ffffff';
    this.context.font = 'bold 12px system-ui';
    this.context.textAlign = 'center';
    this.context.fillText('💡 AI Suggestion', x, y - 20);

    this.context.font = '10px system-ui';
    this.context.fillText(content.suggestion || '', x, y);
    this.context.fillText(`+${content.projectedGain || 0} pts`, x, y + 20);
  }

  private roundRect(x: number, y: number, width: number, height: number, radius: number): void {
    if (!this.context) return;

    this.context.beginPath();
    this.context.moveTo(x + radius, y);
    this.context.lineTo(x + width - radius, y);
    this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.context.lineTo(x + width, y + height - radius);
    this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.context.lineTo(x + radius, y + height);
    this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.context.lineTo(x, y + radius);
    this.context.quadraticCurveTo(x, y, x + radius, y);
    this.context.closePath();
  }

  addOverlay(overlay: Omit<AROverlay, "id">): string {
    const id = `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullOverlay: AROverlay = { ...overlay, id };
    
    this.overlays.set(id, fullOverlay);

    // Auto-remove if duration is set
    if (overlay.duration) {
      setTimeout(() => {
        this.removeOverlay(id);
      }, overlay.duration);
    }

    return id;
  }

  removeOverlay(id: string): boolean {
    return this.overlays.delete(id);
  }

  updateOverlay(id: string, updates: Partial<AROverlay>): boolean {
    const overlay = this.overlays.get(id);
    if (!overlay) return false;

    const updatedOverlay = { ...overlay, ...updates };
    this.overlays.set(id, updatedOverlay);
    return true;
  }

  // Predefined AR experiences
  async startGameWatchMode(gameId: string, userPlayers: string[]): Promise<void> {
    if (!this.arSession) return;

    // Add player tracking overlays
    userPlayers.forEach((playerId, index) => {
      this.addOverlay({
        type: "player_card",
        position: { x: 0.1 + (index * 0.2), y: 0.8, z: 1 },
        content: {
          playerId,
          name: `Player ${index + 1}`,
          position: "RB",
          team: "SF",
          points: 0,
          projectedPoints: 15.5,
        },
        priority: "medium",
        interactive: true,
      });
    });

    // Add live scoring overlay
    this.addOverlay({
      type: "stat_bubble",
      position: { x: 0.9, y: 0.1, z: 0.5 },
      content: {
        value: "LIVE",
        color: "#EF4444",
      },
      priority: "high",
    });
  }

  async showPlayerStats(playerId: string, position: { x: number; y: number }): Promise<void> {
    // Mock player stats
    const stats = await this.fetchPlayerStats(playerId);
    
    this.addOverlay({
      type: "player_card",
      position: { x: position.x / window.innerWidth, y: position.y / window.innerHeight, z: 1 },
      content: stats,
      duration: 5000,
      priority: "high",
      interactive: true,
    });
  }

  async showLineupSuggestion(suggestion: any): Promise<void> {
    this.addOverlay({
      type: "lineup_suggestion",
      position: { x: 0.5, y: 0.3, z: 0.8 },
      content: suggestion,
      duration: 8000,
      priority: "high",
    });
  }

  async showAlert(alert: { title: string; message: string; priority: "low" | "medium" | "high" | "critical" }): Promise<void> {
    this.addOverlay({
      type: "alert",
      position: { x: 0.5, y: 0.1, z: 0.2 },
      content: alert,
      duration: alert.priority === "critical" ? 10000 : 5000,
      priority: alert.priority,
    });
  }

  endARSession(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.canvas) {
      document.body.removeChild(this.canvas);
      this.canvas = null;
      this.context = null;
    }

    if (this.xrSession) {
      this.xrSession.end();
      this.xrSession = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.overlays.clear();
    
    if (this.arSession) {
      this.arSession.endTime = new Date();
      this.arSession = null;
    }
  }

  // Mock API calls
  private async fetchPlayerStats(playerId: string): Promise<any> {
    // This would integrate with real player data
    return {
      playerId,
      name: "Christian McCaffrey",
      position: "RB",
      team: "SF",
      points: 18.6,
      projectedPoints: 22.1,
      stats: {
        rushingYards: 95,
        receivingYards: 45,
        touchdowns: 2,
      },
    };
  }

  // Device motion integration for better AR tracking
  enableMotionTracking(): void {
    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', (event) => {
        // Use motion data to adjust overlay positions
        this.handleDeviceMotion(event);
      });
    }

    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', (event) => {
        // Use orientation data for AR positioning
        this.handleDeviceOrientation(event);
      });
    }
  }

  private handleDeviceMotion(event: DeviceMotionEvent): void {
    // Adjust overlays based on device movement for more stable AR
    const acceleration = event.acceleration;
    if (acceleration) {
      // Apply stabilization to overlays
      this.overlays.forEach((overlay) => {
        // Subtle position adjustments based on motion
        const dampening = 0.01;
        overlay.position.x += (acceleration.x || 0) * dampening;
        overlay.position.y += (acceleration.y || 0) * dampening;
      });
    }
  }

  private handleDeviceOrientation(event: DeviceOrientationEvent): void {
    // Use device orientation for AR camera tracking
    const { alpha, beta, gamma } = event;
    
    // Adjust overlay positions based on device orientation
    this.overlays.forEach((overlay) => {
      // Apply rotation-based positioning adjustments
      if (alpha !== null && beta !== null && gamma !== null) {
        // Subtle adjustments for orientation-aware AR
        const orientationFactor = 0.001;
        overlay.position.x += gamma * orientationFactor;
        overlay.position.y += beta * orientationFactor;
      }
    });
  }
}