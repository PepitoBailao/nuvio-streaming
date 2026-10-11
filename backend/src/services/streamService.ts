import { logger } from '../utils/logger';
import QualityProfileManager, {
  QualityProfile,
  StreamMetadata,
} from './qualityProfiles';
import FailoverService, { FailoverOptions } from './failoverService';

/**
 * Stream selection request
 */
export interface StreamRequest {
  contentId: string; // Movie or series ID
  query: string; // Search query
  profile: QualityProfile; // Quality profile
  language?: string; // Preferred language (VF, VOSTFR, etc.)
  isAnime?: boolean; // Is anime content
}

/**
 * Stream selection response
 */
export interface StreamResponse {
  contentId: string;
  title: string;
  profile: QualityProfile;
  selectedStream: StreamMetadata & { score: number };
  alternativeStreams: Array<StreamMetadata & { score: number }>;
  score: number; // Selected stream score (0-100)
  loadTime?: number; // Estimated load time in ms
}

/**
 * Stream Service
 * Manages stream selection using quality profiles and failover
 */
export class StreamService {
  private failoverService: FailoverService;
  private qualityCache: Map<string, StreamMetadata[]> = new Map();
  private cacheTTL = 3600000; // 1 hour

  constructor() {
    this.failoverService = new FailoverService();
  }

  /**
   * Select best stream for content based on quality profile
   */
  async selectStream(request: StreamRequest): Promise<StreamResponse> {
    const startTime = Date.now();

    try {
      logger.info({
        context: 'stream-selection',
        contentId: request.contentId,
        profile: request.profile,
        query: request.query,
      });

      // Get candidate streams
      const streams = await this.getCandidateStreams(request);

      if (streams.length === 0) {
        throw new Error(`No streams found for: ${request.query}`);
      }

      logger.debug({
        context: 'stream-selection',
        action: 'candidates-found',
        count: streams.length,
      });

      // Rank streams by profile
      const ranked = QualityProfileManager.rankStreams(
        streams,
        request.profile,
      );

      if (ranked.length === 0) {
        throw new Error(
          `No valid streams for profile ${request.profile}: ${request.query}`,
        );
      }

      // Get top 3 candidates
      const topCandidates = ranked.slice(0, 3);
      const selectedStream = topCandidates[0];
      const alternativeStreams = topCandidates.slice(1);

      logger.info({
        context: 'stream-selection',
        action: 'stream-selected',
        title: selectedStream.title,
        score: selectedStream.score.toFixed(2),
        resolution: `${selectedStream.resolution}p`,
        provider: selectedStream.provider,
        alternatives: alternativeStreams.length,
      });

      return {
        contentId: request.contentId,
        title: selectedStream.title,
        profile: request.profile,
        selectedStream,
        alternativeStreams,
        score: selectedStream.score,
        loadTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error({
        context: 'stream-selection',
        error: error instanceof Error ? error.message : String(error),
        contentId: request.contentId,
      });
      throw error;
    }
  }

  /**
   * Get candidate streams (would integrate with TorBox API in production)
   */
  private async getCandidateStreams(
    request: StreamRequest,
  ): Promise<StreamMetadata[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(request.query, request.isAnime);
    const cached = this.qualityCache.get(cacheKey);

    if (cached) {
      logger.debug({
        context: 'stream-service',
        action: 'cache-hit',
        query: request.query,
      });
      return cached;
    }

    // In production, this would call TorBox API
    // For now, return mock data
    const streams = this.getMockStreams(request);

    // Cache results
    this.qualityCache.set(cacheKey, streams);
    setTimeout(() => this.qualityCache.delete(cacheKey), this.cacheTTL);

    return streams;
  }

  /**
   * Get cache key
   */
  private getCacheKey(query: string, isAnime?: boolean): string {
    return `${query}:${isAnime ? 'anime' : 'content'}`;
  }

  /**
   * Get mock streams for testing (replace with TorBox API call)
   */
  private getMockStreams(request: StreamRequest): StreamMetadata[] {
    // Mock data for different content types
    if (request.isAnime) {
      return this.getAnimeStreams(request.query);
    }

    return this.getMovieStreams(request.query);
  }

  /**
   * Get mock anime streams
   */
  private getAnimeStreams(query: string): StreamMetadata[] {
    return [
      {
        title: `${query} · 1080p · Multi Sub`,
        resolution: 1080,
        bitrate: 5.5,
        fileSize: 1.2,
        codec: 'H264',
        format: 'WEB-DL',
        language: 'Multi',
        duration: 24,
        latency: 80,
        provider: 'YGG',
        releaseDate: new Date(),
        group: 'HorribleSubs',
      },
      {
        title: `${query} · 720p · Sub FR`,
        resolution: 720,
        bitrate: 3.5,
        fileSize: 0.75,
        codec: 'H264',
        format: 'WEB-DL',
        language: 'FR',
        duration: 24,
        latency: 60,
        provider: 'C411',
        releaseDate: new Date(),
        group: 'Erai-raws',
      },
      {
        title: `${query} · 480p · Web`,
        resolution: 480,
        bitrate: 1.5,
        fileSize: 0.35,
        codec: 'H264',
        format: 'WEB-DL',
        language: 'FR',
        duration: 24,
        latency: 40,
        provider: 'Tr4ker',
        releaseDate: new Date(),
      },
    ];
  }

  /**
   * Get mock movie streams
   */
  private getMovieStreams(query: string): StreamMetadata[] {
    return [
      {
        title: `${query} · 4K · REMUX`,
        resolution: 2160,
        bitrate: 100,
        fileSize: 54.2,
        codec: 'H265',
        format: 'REMUX',
        language: 'Multi',
        duration: 166,
        latency: 50,
        provider: 'YGG',
        releaseDate: new Date(),
        group: 'FraMeSToR',
      },
      {
        title: `${query} · 1080p · BluRay`,
        resolution: 1080,
        bitrate: 8.5,
        fileSize: 2.5,
        codec: 'H265',
        format: 'BluRay',
        language: 'Multi',
        duration: 166,
        latency: 100,
        provider: 'C411',
        releaseDate: new Date(),
        group: 'LOST',
      },
      {
        title: `${query} · 720p · WEB-DL`,
        resolution: 720,
        bitrate: 3.2,
        fileSize: 1.0,
        codec: 'H264',
        format: 'WEB-DL',
        language: 'VF',
        duration: 166,
        latency: 30,
        provider: 'Tr4ker',
        releaseDate: new Date(),
        group: 'UTT',
      },
      {
        title: `${query} · 480p · WEB-DL`,
        resolution: 480,
        bitrate: 1.2,
        fileSize: 0.5,
        codec: 'H264',
        format: 'WEB-DL',
        language: 'VF',
        duration: 166,
        latency: 25,
        provider: 'Free-Telecharger',
        releaseDate: new Date(),
      },
    ];
  }

  /**
   * Play stream with automatic failover
   */
  async playStream(
    selectedStream: StreamMetadata & { score: number },
    alternativeStreams: Array<StreamMetadata & { score: number }>,
  ): Promise<{ url: string; provider: string; fallbackLinks: string[] }> {
    const allStreams = [selectedStream, ...alternativeStreams];

    // Create failover options
    const failoverOptions: FailoverOptions = {
      maxRetries: 3,
      retryDelayMs: 1000,
      timeoutMs: 10000,
    };

    logger.info({
      context: 'stream-playback',
      title: selectedStream.title,
      provider: selectedStream.provider,
      alternatives: alternativeStreams.length,
    });

    // In production, this would attempt to get streaming link from each provider
    // For now, simulate successful response
    return {
      url: `https://stream.example.com/${selectedStream.provider}/${selectedStream.title}`,
      provider: selectedStream.provider,
      fallbackLinks: alternativeStreams.map(
        s => `https://stream.example.com/${s.provider}/${s.title}`,
      ),
    };
  }

  /**
   * Get all available profiles
   */
  getAllProfiles() {
    return QualityProfileManager.getAllProfiles();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.qualityCache.clear();
    logger.info({ context: 'stream-service', action: 'cache-cleared' });
  }
}

export default StreamService;
