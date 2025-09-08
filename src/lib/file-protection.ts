// File Protection Utilities for Flemoji Music Platform

export interface WatermarkConfig {
  userId: string;
  trackId: string;
  timestamp: number;
  platform: string;
}

export interface ProtectionSettings {
  watermarking: boolean;
  geoBlocking: string[]; // Country codes to block
  timeRestrictions: {
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
    timezone: string;
  };
  deviceLimits: {
    maxDevices: number;
    allowMobile: boolean;
    allowDesktop: boolean;
  };
  streamingLimits: {
    maxSimultaneousStreams: number;
    maxPlaysPerDay: number;
    maxPlaysPerWeek: number;
  };
}

export class FileProtectionManager {
  /**
   * Generate a unique watermark ID for tracking
   */
  static generateWatermarkId(config: WatermarkConfig): string {
    const data = `${config.userId}-${config.trackId}-${config.timestamp}-${config.platform}`;
    return Buffer.from(data).toString('base64').replace(/[+/=]/g, '');
  }

  /**
   * Create audio watermark data (for embedding in audio files)
   */
  static createAudioWatermark(watermarkId: string): number[] {
    // Convert watermark ID to binary and create inaudible audio markers
    const binary = watermarkId
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join('');
    const markers: number[] = [];

    // Create inaudible markers at specific frequencies
    for (let i = 0; i < binary.length; i++) {
      const bit = binary[i];
      // Use frequencies outside human hearing range (18kHz+)
      const frequency = bit === '1' ? 19000 : 18500;
      markers.push(frequency);
    }

    return markers;
  }

  /**
   * Generate unique track URL with protection parameters
   */
  static generateProtectedUrl(
    trackId: string,
    userId: string,
    settings: ProtectionSettings
  ): string {
    const baseUrl = `${process.env.NEXTAUTH_URL}/track/${trackId}`;
    const params = new URLSearchParams();

    // Add watermark
    if (settings.watermarking) {
      const watermarkId = this.generateWatermarkId({
        userId,
        trackId,
        timestamp: Date.now(),
        platform: 'web',
      });
      params.set('wm', watermarkId);
    }

    // Add geo-blocking info
    if (settings.geoBlocking.length > 0) {
      params.set('geo', settings.geoBlocking.join(','));
    }

    // Add time restrictions
    if (
      settings.timeRestrictions.startTime ||
      settings.timeRestrictions.endTime
    ) {
      params.set(
        'time',
        `${settings.timeRestrictions.startTime || ''}-${settings.timeRestrictions.endTime || ''}`
      );
      params.set('tz', settings.timeRestrictions.timezone);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Validate access based on protection settings
   */
  static validateAccess(
    userId: string,
    trackId: string,
    request: {
      ip?: string;
      userAgent?: string;
      country?: string;
      deviceType?: 'mobile' | 'desktop';
      timestamp?: number;
    },
    settings: ProtectionSettings
  ): { allowed: boolean; reason?: string } {
    // Check geo-blocking
    if (settings.geoBlocking.length > 0 && request.country) {
      if (settings.geoBlocking.includes(request.country)) {
        return {
          allowed: false,
          reason: 'Content not available in your region',
        };
      }
    }

    // Check time restrictions
    if (
      settings.timeRestrictions.startTime ||
      settings.timeRestrictions.endTime
    ) {
      const now = new Date();
      const timezone = settings.timeRestrictions.timezone;
      const localTime = new Date(
        now.toLocaleString('en-US', { timeZone: timezone })
      );
      const currentTime = localTime.toTimeString().slice(0, 5);

      if (
        settings.timeRestrictions.startTime &&
        currentTime < settings.timeRestrictions.startTime
      ) {
        return { allowed: false, reason: 'Content not available at this time' };
      }

      if (
        settings.timeRestrictions.endTime &&
        currentTime > settings.timeRestrictions.endTime
      ) {
        return { allowed: false, reason: 'Content not available at this time' };
      }
    }

    // Check device limits
    if (request.deviceType) {
      if (
        request.deviceType === 'mobile' &&
        !settings.deviceLimits.allowMobile
      ) {
        return { allowed: false, reason: 'Mobile access not allowed' };
      }

      if (
        request.deviceType === 'desktop' &&
        !settings.deviceLimits.allowDesktop
      ) {
        return { allowed: false, reason: 'Desktop access not allowed' };
      }
    }

    return { allowed: true };
  }

  /**
   * Generate DRM token for protected content
   */
  static generateDRMToken(
    trackId: string,
    userId: string,
    expiresIn: number = 3600 // 1 hour default
  ): string {
    const payload = {
      trackId,
      userId,
      exp: Math.floor(Date.now() / 1000) + expiresIn,
      iat: Math.floor(Date.now() / 1000),
    };

    // In production, use a proper JWT library with secret key
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Create blockchain hash for copyright protection
   */
  static async createCopyrightHash(trackData: {
    title: string;
    artist: string;
    duration: number;
    fileHash: string;
    timestamp: number;
  }): Promise<string> {
    const data = `${trackData.title}-${trackData.artist}-${trackData.duration}-${trackData.fileHash}-${trackData.timestamp}`;

    // In production, use a proper crypto library
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Default protection settings
export const DEFAULT_PROTECTION_SETTINGS: ProtectionSettings = {
  watermarking: true,
  geoBlocking: [],
  timeRestrictions: {
    timezone: 'UTC',
  },
  deviceLimits: {
    maxDevices: 5,
    allowMobile: true,
    allowDesktop: true,
  },
  streamingLimits: {
    maxSimultaneousStreams: 3,
    maxPlaysPerDay: 100,
    maxPlaysPerWeek: 500,
  },
};
