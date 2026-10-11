# Quality Profiles Documentation

## Overview

Nuvio Streaming features **4 intelligent quality profiles** that automatically select the best stream based on your preferences. Each profile uses a sophisticated scoring algorithm that considers multiple factors: resolution, bitrate, codec, format, file size, and latency.

## The 4 Profiles

### 1. **PepitoCiné** - Maximum Quality 🎬

**For**: Cinephiles who want the absolute best quality

- **Max Resolution**: 4K (2160p)
- **Bitrate Range**: 50-150 Mb/s
- **Preferred Codecs**: H.265, AV1
- **Preferred Formats**: REMUX, BluRay
- **Max File Size**: 100 GB
- **Scoring Priorities**:
  - 35% Bitrate (very high bitrate)
  - 30% Resolution (4K is king)
  - 15% Codec quality
  - 12% Format quality
  - 5% File size (doesn't matter)
  - 3% Latency (can wait)

**Best For**:
- Home theater setups
- Large 4K displays
- When bandwidth is unlimited
- Critical viewing experience

**Example Selection**:
```
✓ Dune Part Two · 4K REMUX · 54.2GB · 100 Mb/s
  Score: 95/100
  Provider: YGG | C411 | Tr4ker (with failover)
```

---

### 2. **PepitoDuVoyage** - Low Bandwidth 📱

**For**: Mobile users, travelers, limited bandwidth

- **Max Resolution**: 480p
- **Bitrate Range**: 0.5-2 Mb/s
- **Preferred Codecs**: H.264
- **Preferred Formats**: WEB-DL, HDTV
- **Max File Size**: 2 GB
- **Scoring Priorities**:
  - 40% Latency (speed is everything)
  - 35% File size (bandwidth critical)
  - 10% Bitrate (low is OK)
  - 5% Format, Codec, Resolution (don't matter)

**Best For**:
- Mobile phones
- Travelers/commute
- Limited bandwidth (< 5 Mb/s)
- Quick start priority

**Example Selection**:
```
✓ Breaking Bad S04E04 · 480p WEB-DL · 345MB · 1.2 Mb/s
  Score: 88/100
  Loads in ~2 seconds
  Provider: Tr4ker (fastest)
```

---

### 3. **Pepito** - Balanced ⚖️

**For**: Most users - best quality without compromise

- **Max Resolution**: 1080p
- **Bitrate Range**: 5-15 Mb/s
- **Preferred Codecs**: H.265, H.264
- **Preferred Formats**: BluRay, WEB-DL
- **Max File Size**: 10 GB
- **Scoring Priorities**:
  - 25% Bitrate (good quality matters)
  - 25% Resolution (1080p is solid)
  - 15% Codec quality
  - 15% Format quality
  - 12% File size (moderate)
  - 8% Latency (normal speed)

**Best For**:
- Standard TV viewing
- Most streaming devices
- Balanced quality/speed
- Default recommendation

**Example Selection**:
```
✓ Dune Part Two · 1080p BluRay · 2.5GB · 8.5 Mb/s
  Score: 82/100
  Provider: C411 | Tr4ker | YGG (with failover)
```

---

### 4. **PepitoMacqueen** - Fastest Loading ⚡

**For**: Speed obsessed - start watching now

- **Max Resolution**: 1080p
- **Bitrate Range**: 0.5-20 Mb/s
- **Preferred Codecs**: H.264, H.265
- **Preferred Formats**: WEB-DL, HDTV, BluRay
- **Max File Size**: 15 GB
- **Scoring Priorities**:
  - 50% Latency (lowest latency first!)
  - 20% File size (speed-related)
  - 10% Resolution (any quality OK)
  - 10% Bitrate
  - 5% Codec, Format (any works)

**Best For**:
- Impatient viewers
- Unstable connections
- When latency matters more than quality
- Fast initial buffering

**Example Selection**:
```
✓ Series Season 1 Episode 1 · 720p HDTV · 1.2GB · 3.2 Mb/s
  Score: 91/100
  Loads in ~1 second (fast provider)
  Provider: Tr4ker (lowest latency)
```

---

## Scoring Algorithm

### Step 1: Filtering
Streams are rejected if they violate profile constraints:
```
if (resolution > maxResolution) → Score = 0
if (bitrate < minBitrate || bitrate > maxBitrate) → Score = 0
if (fileSize > maxFileSize) → Score = 0
```

### Step 2: Sub-Scoring
For each stream factor, calculate a 0-100 score:

| Factor | Calculation | Notes |
|--------|-------------|-------|
| **Bitrate** | Linear interpolation (min to max) | Higher is better |
| **Resolution** | Tier-based (480→20, 720→50, 1080→80, 4K→100) | Higher is better (until max) |
| **Codec** | Lookup table (AV1=90, H265=80, H264=60, etc.) | Preferred codecs = 100 |
| **Format** | Lookup table (REMUX=95, BluRay=90, WEB-DL=75, etc.) | Preferred formats = 100 |
| **File Size** | Inverse ratio (small=better) | `(1 - ratio) × 100` |
| **Latency** | Inverse (0ms=100, 10s=0) | `100 - (ms / 100)` |

### Step 3: Weighted Average
```
Final Score = Σ(subScore × weight)

Example for Pepito profile:
= (BitrateScore × 0.25)
+ (ResolutionScore × 0.25)
+ (CodecScore × 0.15)
+ (FormatScore × 0.15)
+ (FileSizeScore × 0.12)
+ (LatencyScore × 0.08)
```

---

## Usage Examples

### Example 1: Movie Streaming

**User**: Wants to watch Dune Part Two in maximum quality

```typescript
import StreamService from './services/streamService';

const streamService = new StreamService();

const result = await streamService.selectStream({
  contentId: 'dune-part-two-2024',
  query: 'Dune Part Two 2024 Multi 2160p',
  profile: QualityProfile.PEPITO_CINE,
  language: 'VF',
});

// Result:
// {
//   selectedStream: {
//     title: 'Dune Part Two · 4K REMUX',
//     resolution: 2160,
//     bitrate: 100,
//     score: 95,
//     provider: 'YGG',
//     alternativeLinks: ['C411', 'Tr4ker'] // Automatic failover
//   }
// }
```

### Example 2: Mobile Viewing

**User**: Watching on phone with limited data

```typescript
const result = await streamService.selectStream({
  contentId: 'breaking-bad-s04e04',
  query: 'Breaking Bad S04E04 480p',
  profile: QualityProfile.PEPITO_DU_VOYAGE,
  language: 'VF',
});

// Result:
// {
//   selectedStream: {
//     title: 'Breaking Bad S04E04 · 480p WEB-DL',
//     resolution: 480,
//     fileSize: 0.35,
//     bitrate: 1.2,
//     score: 88,
//     provider: 'Tr4ker',
//     loadTime: 1250 // ms
//   }
// }
```

### Example 3: Anime with Fastest Profile

**User**: Wants anime with lowest latency

```typescript
const result = await streamService.selectStream({
  contentId: 'naruto-shippuden-s22e42',
  query: 'Naruto Shippuden S22E42',
  profile: QualityProfile.PEPITO_MACQUEEN,
  isAnime: true,
});

// Result:
// {
//   selectedStream: {
//     title: 'Naruto Shippuden S22E42 · 1080p',
//     score: 91,
//     provider: 'Tr4ker', // Lowest latency
//     alternativeStreams: [2 more providers]
//   }
// }
```

---

## Failover Mechanism

Each stream selection provides **3 automatic backups**:

1. **Selected Stream**: Top-scored option
2. **Alternative 1**: 2nd best option
3. **Alternative 2**: 3rd best option

If playback fails:
```
Try Stream 1 (YGG) → ✗ Failed
  ↓
Try Stream 2 (C411) → ✓ Success
```

**Benefits**:
- ✅ No manual switching needed
- ✅ Transparent to user
- ✅ Automatic on network errors
- ✅ Fallback provider caching (1 hour)

---

## Performance

### Query Response Time
- **First query**: < 500ms (API + ranking)
- **Cached queries**: < 10ms (in-memory)
- **Cache TTL**: 1 hour per content

### Scoring Speed
- **Per-stream scoring**: < 1ms
- **Ranking 100 streams**: < 50ms
- **Top 3 selection**: < 10ms

---

## Advanced: Custom Profiles

You can extend with custom profiles:

```typescript
const customProfile: QualityProfileConfig = {
  name: 'my-custom-profile',
  label: 'My Custom',
  description: '...',
  maxResolution: 720,
  minBitrate: 2,
  maxBitrate: 10,
  maxFileSize: 5,
  preferredCodecs: ['H265'],
  preferredFormats: ['WEB-DL'],
  scoringWeights: {
    bitrate: 0.3,
    resolution: 0.3,
    codec: 0.2,
    format: 0.1,
    fileSize: 0.05,
    latency: 0.05,
  },
};
```

---

## Summary Table

| Profile | Resolution | Bitrate | Size | Speed | Best For |
|---------|-----------|---------|------|-------|----------|
| **PepitoCiné** | 4K | 50-150 Mb/s | ∞ | Slow OK | Cinephiles |
| **PepitoDuVoyage** | 480p | 0.5-2 Mb/s | 2GB | ⚡ | Mobile |
| **Pepito** | 1080p | 5-15 Mb/s | 10GB | Normal | Most users |
| **PepitoMacqueen** | 1080p | 0.5-20 Mb/s | 15GB | ⚡⚡ | Speed |

---

**Questions?** See [ARCHITECTURE.md](./ARCHITECTURE.md) or [API.md](./API.md)
