import QualityProfileManager, {
  QualityProfile,
  StreamMetadata,
} from '../qualityProfiles';

describe('QualityProfileManager', () => {
  const mockStreams: StreamMetadata[] = [
    {
      title: 'Dune Part Two · 4K · REMUX',
      resolution: 2160,
      bitrate: 100,
      fileSize: 54.2,
      codec: 'H265',
      format: 'REMUX',
      language: 'French',
      duration: 166,
      latency: 50,
      provider: 'YGG',
      releaseDate: new Date(),
    },
    {
      title: 'Dune Part Two · 1080p · BluRay',
      resolution: 1080,
      bitrate: 8.5,
      fileSize: 2.5,
      codec: 'H265',
      format: 'BluRay',
      language: 'French',
      duration: 166,
      latency: 100,
      provider: 'C411',
      releaseDate: new Date(),
    },
    {
      title: 'Dune Part Two · 480p · WEB-DL',
      resolution: 480,
      bitrate: 1.2,
      fileSize: 0.5,
      codec: 'H264',
      format: 'WEB-DL',
      language: 'French',
      duration: 166,
      latency: 30,
      provider: 'Tr4ker',
      releaseDate: new Date(),
    },
  ];

  describe('Profile Configuration', () => {
    it('should return all 4 profiles', () => {
      const profiles = QualityProfileManager.getAllProfiles();
      expect(profiles).toHaveLength(4);
    });

    it('should get PepitoCiné profile', () => {
      const profile = QualityProfileManager.getProfile(QualityProfile.PEPITO_CINE);
      expect(profile.label).toBe('PepitoCiné');
      expect(profile.maxResolution).toBe(2160);
      expect(profile.minBitrate).toBe(50);
    });

    it('should get PepitoDuVoyage profile', () => {
      const profile = QualityProfileManager.getProfile(QualityProfile.PEPITO_DU_VOYAGE);
      expect(profile.label).toBe('PepitoDuVoyage');
      expect(profile.maxResolution).toBe(480);
      expect(profile.maxFileSize).toBe(2);
    });

    it('should get Pepito profile', () => {
      const profile = QualityProfileManager.getProfile(QualityProfile.PEPITO);
      expect(profile.label).toBe('Pepito');
      expect(profile.maxResolution).toBe(1080);
    });

    it('should get PepitoMacqueen profile', () => {
      const profile = QualityProfileManager.getProfile(QualityProfile.PEPITO_MACQUEEN);
      expect(profile.label).toBe('PepitoMacqueen');
      expect(profile.scoringWeights.latency).toBe(0.5);
    });
  });

  describe('Scoring Algorithm', () => {
    it('should score 4K REMUX stream highly in PepitoCiné', () => {
      const score = QualityProfileManager.scoreStream(
        mockStreams[0],
        QualityProfile.PEPITO_CINE,
      );
      expect(score).toBeGreaterThan(70);
    });

    it('should score 480p stream in PepitoDuVoyage', () => {
      const score = QualityProfileManager.scoreStream(
        mockStreams[2],
        QualityProfile.PEPITO_DU_VOYAGE,
      );
      expect(score).toBeGreaterThan(60);
    });

    it('should filter out incompatible resolutions', () => {
      const score = QualityProfileManager.scoreStream(
        mockStreams[0],
        QualityProfile.PEPITO_DU_VOYAGE,
      );
      expect(score).toBe(0); // 2160p exceeds max 480p
    });
  });

  describe('Stream Ranking', () => {
    it('should rank streams by score highest first', () => {
      const ranked = QualityProfileManager.rankStreams(
        mockStreams,
        QualityProfile.PEPITO,
      );
      
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].score).toBeGreaterThanOrEqual(ranked[i + 1].score);
      }
    });

    it('should return top N streams', () => {
      const top2 = QualityProfileManager.getTopStreams(
        mockStreams,
        QualityProfile.PEPITO,
        2,
      );
      
      expect(top2.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty stream list', () => {
      const ranked = QualityProfileManager.rankStreams([], QualityProfile.PEPITO);
      expect(ranked).toEqual([]);
    });

    it('should handle zero latency', () => {
      const stream: StreamMetadata = {
        ...mockStreams[0],
        latency: 0,
      };
      const score = QualityProfileManager.scoreStream(stream, QualityProfile.PEPITO);
      expect(score).toBeGreaterThan(0);
    });
  });
});
