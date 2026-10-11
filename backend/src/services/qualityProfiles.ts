import { logger } from '../utils/logger';

/**
 * Quality Profile Types
 */
export enum QualityProfile {
  PEPITO_CINE = 'pepito-cine',           // Maximum quality
  PEPITO_DU_VOYAGE = 'pepito-du-voyage', // Minimum quality (low bandwidth)
  PEPITO = 'pepito',                      // Balanced quality
  PEPITO_MACQUEEN = 'pepito-macqueen',    // Fastest loading
}

/**
 * Quality Profile Configuration
 */
export interface QualityProfileConfig {
  name: QualityProfile;
  label: string;
  description: string;
  maxResolution: number; // 480, 720, 1080, 2160
  minBitrate: number; // Mb/s
  maxBitrate: number; // Mb/s
  maxFileSize: number; // GB
  preferredCodecs: string[];
  preferredFormats: string[];
  scoringWeights: ScoringWeights;
}

/**
 * Scoring weights for different factors
 */
export interface ScoringWeights {
  bitrate: number;
  resolution: number;
  fileSize: number;
  codec: number;
  format: number;
  latency: number;
}

/**
 * Stream metadata for scoring
 */
export interface StreamMetadata {
  title: string;
  resolution: number; // 480, 720, 1080, 2160
  bitrate: number; // Mb/s
  fileSize: number; // GB
  codec: string; // H264, H265, AV1
  format: string; // BluRay, WEB-DL, HDTV, REMUX
  language: string;
  duration: number; // minutes
  latency: number; // ms, estimated from provider
  provider: string;
  releaseDate: Date;
  group?: string;
}

/**
 * Quality Profiles Configuration
 */
const QUALITY_PROFILES: Record<QualityProfile, QualityProfileConfig> = {
  [QualityProfile.PEPITO_CINE]: {
    name: QualityProfile.PEPITO_CINE,
    label: 'PepitoCiné',
    description: 'Maximum quality - 4K, REMUX, best codecs',
    maxResolution: 2160,
    minBitrate: 50,
    maxBitrate: 150,
    maxFileSize: 100,
    preferredCodecs: ['H265', 'AV1'],
    preferredFormats: ['REMUX', 'BluRay'],
    scoringWeights: {
      bitrate: 0.35,      // Very high bitrate priority
      resolution: 0.30,   // 4K is king
      codec: 0.15,        // Good codec matters
      format: 0.12,       // Format quality
      fileSize: 0.05,     // Size doesn't matter
      latency: 0.03,      // Can wait a bit
    },
  },

  [QualityProfile.PEPITO_DU_VOYAGE]: {
    name: QualityProfile.PEPITO_DU_VOYAGE,
    label: 'PepitoDuVoyage',
    description: 'Low quality - mobile friendly, <2GB, fastest loading',
    maxResolution: 480,
    minBitrate: 0.5,
    maxBitrate: 2,
    maxFileSize: 2,
    preferredCodecs: ['H264'],
    preferredFormats: ['WEB-DL', 'HDTV'],
    scoringWeights: {
      bitrate: 0.10,      // Low bitrate is OK
      resolution: 0.05,   // Resolution doesn't matter
      codec: 0.05,        // Any codec works
      format: 0.05,       // Format not important
      fileSize: 0.35,     // Size is critical (bandwidth)
      latency: 0.40,      // Speed is everything
    },
  },

  [QualityProfile.PEPITO]: {
    name: QualityProfile.PEPITO,
    label: 'Pepito',
    description: 'Balanced - 1080p, good quality, reasonable size',
    maxResolution: 1080,
    minBitrate: 5,
    maxBitrate: 15,
    maxFileSize: 10,
    preferredCodecs: ['H265', 'H264'],
    preferredFormats: ['BluRay', 'WEB-DL'],
    scoringWeights: {
      bitrate: 0.25,      // Good bitrate matters
      resolution: 0.25,   // 1080p is good
      codec: 0.15,        // Codec quality
      format: 0.15,       // Format balance
      fileSize: 0.12,     // Size moderate
      latency: 0.08,      // Normal speed
    },
  },

  [QualityProfile.PEPITO_MACQUEEN]: {
    name: QualityProfile.PEPITO_MACQUEEN,
    label: 'PepitoMacqueen',
    description: 'Fastest loading - any quality, lowest latency',
    maxResolution: 1080,
    minBitrate: 0.5,
    maxBitrate: 20,
    maxFileSize: 15,
    preferredCodecs: ['H264', 'H265'],
    preferredFormats: ['WEB-DL', 'HDTV', 'BluRay'],
    scoringWeights: {
      bitrate: 0.10,
      resolution: 0.10,
      codec: 0.05,
      format: 0.05,
      fileSize: 0.20,     // Size somewhat important for speed
      latency: 0.50,      // Latency is the priority
    },
  },
};

/**
 * Quality Profile Manager
 */
export class QualityProfileManager {
  /**
   * Get quality profile by name
   */
  static getProfile(profile: QualityProfile): QualityProfileConfig {
    return QUALITY_PROFILES[profile];
  }

  /**
   * Get all profiles
   */
  static getAllProfiles(): QualityProfileConfig[] {
    return Object.values(QUALITY_PROFILES);
  }

  /**
   * Calculate score for a stream based on profile
   * Score range: 0-100 (higher is better)
   */
  static scoreStream(
    stream: StreamMetadata,
    profile: QualityProfile,
  ): number {
    const config = this.getProfile(profile);

    // Filter: Stream must meet minimum requirements
    if (stream.resolution > config.maxResolution) {
      return 0; // Exceeds max resolution
    }
    if (stream.bitrate < config.minBitrate || stream.bitrate > config.maxBitrate) {
      return 0; // Outside bitrate range
    }
    if (stream.fileSize > config.maxFileSize) {
      return 0; // Exceeds max file size
    }

    // Calculate sub-scores (0-100)
    const bitrateScore = this.scoreBitrate(stream.bitrate, config);
    const resolutionScore = this.scoreResolution(stream.resolution, config);
    const codecScore = this.scoreCodec(stream.codec, config);
    const formatScore = this.scoreFormat(stream.format, config);
    const fileSizeScore = this.scoreFileSize(stream.fileSize, config);
    const latencyScore = this.scoreLatency(stream.latency);

    // Weighted score
    const weights = config.scoringWeights;
    const finalScore =
      bitrateScore * weights.bitrate +
      resolutionScore * weights.resolution +
      codecScore * weights.codec +
      formatScore * weights.format +
      fileSizeScore * weights.fileSize +
      latencyScore * weights.latency;

    return Math.min(100, Math.max(0, finalScore));
  }

  /**
   * Score bitrate (0-100)
   */
  private static scoreBitrate(bitrate: number, config: QualityProfileConfig): number {
    const { minBitrate, maxBitrate } = config;
    if (bitrate < minBitrate) return 0;
    if (bitrate >= maxBitrate) return 100;
    
    // Linear interpolation
    return ((bitrate - minBitrate) / (maxBitrate - minBitrate)) * 100;
  }

  /**
   * Score resolution (0-100)
   */
  private static scoreResolution(resolution: number, config: QualityProfileConfig): number {
    const resolutionTiers = {
      480: 20,
      720: 50,
      1080: 80,
      2160: 100,
    };

    if (resolution > config.maxResolution) return 0;
    
    // Find closest resolution tier
    const tiers = Object.entries(resolutionTiers)
      .filter(([res]) => parseInt(res) <= resolution)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

    if (tiers.length === 0) return 0;
    
    return tiers[0][1];
  }

  /**
   * Score codec (0-100)
   */
  private static scoreCodec(codec: string, config: QualityProfileConfig): number {
    const normalizedCodec = codec.toUpperCase();
    
    if (config.preferredCodecs.includes(normalizedCodec)) {
      return 100;
    }
    
    // Fallback scoring for other codecs
    const codecScores: Record<string, number> = {
      'AV1': 90,
      'H265': 80,
      'HEVC': 80,
      'H264': 60,
      'AVC': 60,
    };

    return codecScores[normalizedCodec] || 40;
  }

  /**
   * Score format (0-100)
   */
  private static scoreFormat(format: string, config: QualityProfileConfig): number {
    const normalizedFormat = format.toUpperCase();
    
    if (config.preferredFormats.includes(normalizedFormat)) {
      return 100;
    }

    // Fallback scoring
    const formatScores: Record<string, number> = {
      'REMUX': 95,
      'BLURAY': 90,
      'WEB-DL': 75,
      'HDTV': 60,
      'WEBRIP': 50,
      'DVDRip': 40,
    };

    return formatScores[normalizedFormat] || 30;
  }

  /**
   * Score file size (0-100)
   * Inverse scoring: smaller is better for bandwidth-limited
   */
  private static scoreFileSize(fileSize: number, config: QualityProfileConfig): number {
    // For profiles with low maxFileSize, penalize larger files
    if (fileSize > config.maxFileSize) {
      return 0;
    }

    // Score inversely: smaller files get higher scores
    const ratio = fileSize / config.maxFileSize;
    return (1 - ratio) * 100;
  }

  /**
   * Score latency (0-100)
   * Lower latency = higher score
   * 0ms = 100, 10000ms = 0
   */
  private static scoreLatency(latencyMs: number): number {
    if (latencyMs <= 0) return 100;
    if (latencyMs >= 10000) return 0;

    return Math.max(0, 100 - (latencyMs / 100));
  }

  /**
   * Rank streams by profile
   * Returns streams sorted by score (highest first)
   */
  static rankStreams(
    streams: StreamMetadata[],
    profile: QualityProfile,
  ): Array<StreamMetadata & { score: number }> {
    return streams
      .map(stream => ({
        ...stream,
        score: this.scoreStream(stream, profile),
      }))
      .filter(item => item.score > 0) // Filter out invalid streams
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }

  /**
   * Get top N streams by profile
   */
  static getTopStreams(
    streams: StreamMetadata[],
    profile: QualityProfile,
    limit: number = 3,
  ): Array<StreamMetadata & { score: number }> {
    return this.rankStreams(streams, profile).slice(0, limit);
  }

  /**
   * Log scoring details for debugging
   */
  static logScoringDetails(
    stream: StreamMetadata,
    profile: QualityProfile,
  ): void {
    const score = this.scoreStream(stream, profile);
    const config = this.getProfile(profile);

    logger.info({
      context: 'quality-scoring',
      stream: stream.title,
      profile: config.label,
      score: score.toFixed(2),
      resolution: `${stream.resolution}p`,
      bitrate: `${stream.bitrate} Mb/s`,
      fileSize: `${stream.fileSize} GB`,
      codec: stream.codec,
      format: stream.format,
      latency: `${stream.latency} ms`,
    });
  }
}

export default QualityProfileManager;
