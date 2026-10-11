# Nuvio Streaming API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require a valid secret token:
```
Authorization: Bearer <token>
```

Get a token: `POST /auth/generate`

---

## Endpoints

### 1. Get Quality Profiles

**Endpoint**: `GET /profiles`

**Description**: Get all available quality profiles

**Response**:
```json
{
  "profiles": [
    {
      "name": "pepito-cine",
      "label": "PepitoCiné",
      "description": "Maximum quality - 4K, REMUX, best codecs",
      "maxResolution": 2160,
      "minBitrate": 50,
      "maxBitrate": 150,
      "maxFileSize": 100,
      "preferredCodecs": ["H265", "AV1"],
      "preferredFormats": ["REMUX", "BluRay"],
      "scoringWeights": {
        "bitrate": 0.35,
        "resolution": 0.30,
        "codec": 0.15,
        "format": 0.12,
        "fileSize": 0.05,
        "latency": 0.03
      }
    },
    // ... other profiles
  ]
}
```

---

### 2. Select Stream

**Endpoint**: `POST /stream/select`

**Description**: Select best stream for content based on quality profile

**Request**:
```json
{
  "contentId": "dune-part-two-2024",
  "query": "Dune Part Two 2024 Multi 2160p",
  "profile": "pepito-cine",
  "language": "VF",
  "isAnime": false
}
```

**Parameters**:
- `contentId` (string, required): Unique identifier for the content
- `query` (string, required): Search query for TorBox API
- `profile` (string, required): Quality profile (`pepito-cine`, `pepito-du-voyage`, `pepito`, `pepito-macqueen`)
- `language` (string, optional): Preferred language (VF, VOSTFR, Multi, etc.)
- `isAnime` (boolean, optional): Is anime content (default: false)

**Response**:
```json
{
  "contentId": "dune-part-two-2024",
  "title": "Dune Part Two · 4K REMUX",
  "profile": "pepito-cine",
  "selectedStream": {
    "title": "Dune Part Two · 4K REMUX",
    "resolution": 2160,
    "bitrate": 100,
    "fileSize": 54.2,
    "codec": "H265",
    "format": "REMUX",
    "language": "Multi",
    "duration": 166,
    "latency": 50,
    "provider": "YGG",
    "releaseDate": "2024-02-29T00:00:00Z",
    "group": "FraMeSToR",
    "score": 95.2
  },
  "alternativeStreams": [
    {
      "title": "Dune Part Two · 1080p BluRay",
      "resolution": 1080,
      "bitrate": 8.5,
      "fileSize": 2.5,
      "codec": "H265",
      "format": "BluRay",
      "language": "Multi",
      "duration": 166,
      "latency": 100,
      "provider": "C411",
      "releaseDate": "2024-02-29T00:00:00Z",
      "group": "LOST",
      "score": 82.5
    },
    {
      "title": "Dune Part Two · 720p WEB-DL",
      "resolution": 720,
      "bitrate": 3.2,
      "fileSize": 1.0,
      "codec": "H264",
      "format": "WEB-DL",
      "language": "VF",
      "duration": 166,
      "latency": 30,
      "provider": "Tr4ker",
      "releaseDate": "2024-02-29T00:00:00Z",
      "group": "UTT",
      "score": 65.3
    }
  ],
  "score": 95.2,
  "loadTime": 285
}
```

**Status Codes**:
- `200`: Stream selected successfully
- `400`: Invalid request parameters
- `401`: Unauthorized (invalid token)
- `404`: No streams found for query
- `500`: Internal server error

---

### 3. Play Stream

**Endpoint**: `POST /stream/play`

**Description**: Get streaming URL and set up automatic failover

**Request**:
```json
{
  "streamId": "dune-part-two-2024",
  "selectedStreamTitle": "Dune Part Two · 4K REMUX",
  "alternativeStreamTitles": [
    "Dune Part Two · 1080p BluRay",
    "Dune Part Two · 720p WEB-DL"
  ]
}
```

**Response**:
```json
{
  "url": "https://stream.example.com/YGG/Dune.Part.Two.2024.MULTi.2160p.UHD.BluRay.REMUX-FraMeSToR.mkv",
  "provider": "YGG",
  "fallbackLinks": [
    "https://stream.example.com/C411/Dune.Part.Two.2024.MULTi.1080p.BluRay.x265-LOST.mkv",
    "https://stream.example.com/Tr4ker/Dune.Part.Two.2024.VF.720p.WEB-DL.x264-UTT.mkv"
  ],
  "expiresIn": 3600,
  "message": "Use url for primary stream. If playback fails, automatic failover will retry with fallbackLinks"
}
```

---

### 4. Rank Streams

**Endpoint**: `POST /stream/rank`

**Description**: Rank multiple streams by a specific quality profile

**Request**:
```json
{
  "profile": "pepito",
  "streams": [
    {
      "title": "Movie · 4K REMUX",
      "resolution": 2160,
      "bitrate": 100,
      "fileSize": 54.2,
      "codec": "H265",
      "format": "REMUX",
      "language": "Multi",
      "duration": 166,
      "latency": 50,
      "provider": "YGG",
      "releaseDate": "2024-02-29T00:00:00Z"
    }
    // ... more streams
  ],
  "limit": 3
}
```

**Response**:
```json
{
  "profile": "pepito",
  "rankedStreams": [
    {
      "title": "Movie · 1080p BluRay",
      "resolution": 1080,
      "score": 82.5,
      "rank": 1,
      "recommendation": "Top choice for Pepito profile"
    },
    {
      "title": "Movie · 720p WEB-DL",
      "resolution": 720,
      "score": 65.3,
      "rank": 2
    }
  ],
  "topScore": 82.5,
  "filteredOut": 1,
  "message": "1 stream filtered out (doesn't meet profile requirements)"
}
```

---

### 5. Authentication - Generate Token

**Endpoint**: `POST /auth/generate`

**Description**: Generate a secret token for API access

**Response**:
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0",
  "expiresIn": 3600,
  "message": "Token generated. Use in Authorization header: Bearer <token>"
}
```

---

### 6. Authentication - Check Token

**Endpoint**: `GET /auth/verify`

**Description**: Verify current token validity

**Headers**:
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "valid": true,
  "expiresIn": 3500,
  "message": "Token is valid"
}
```

---

### 7. Statistics

**Endpoint**: `GET /auth/stats`

**Description**: Get API usage statistics

**Response**:
```json
{
  "totalRequests": 1523,
  "requestsLast24h": 156,
  "cacheHitRate": 0.72,
  "averageResponseTime": 125,
  "profilesUsed": {
    "pepito-cine": 342,
    "pepito": 892,
    "pepito-du-voyage": 214,
    "pepito-macqueen": 75
  },
  "topProviders": {
    "YGG": 456,
    "C411": 389,
    "Tr4ker": 234
  }
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "error": "bad_request",
  "message": "Invalid profile: pepito-invalid",
  "details": {
    "profile": "Must be one of: pepito-cine, pepito-du-voyage, pepito, pepito-macqueen"
  }
}
```

### 401 - Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token",
  "statusCode": 401
}
```

### 404 - Not Found
```json
{
  "error": "not_found",
  "message": "No streams found for: Dune Part Two 2024",
  "statusCode": 404
}
```

### 429 - Rate Limited
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Maximum 10 requests per 15 minutes",
  "retryAfter": 45,
  "statusCode": 429
}
```

### 500 - Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "statusCode": 500
}
```

---

## Rate Limiting

- **Limit**: 10 requests per 15 minutes per token
- **Header**: `X-RateLimit-Remaining: 9`
- **Exceeded**: Returns 429 with `Retry-After` header

---

## Caching

- **Query cache**: 1 hour per search query
- **Profile cache**: 1 hour per profile
- **Cache hits**: < 10ms response time
- **Cache misses**: < 500ms (with API call)

---

## Examples

### Example 1: Complete Flow - Movie

```bash
# 1. Generate token
curl -X POST http://localhost:3000/api/auth/generate

# Save token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...

# 2. Select stream for movie
curl -X POST http://localhost:3000/api/stream/select \
  -H "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..." \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "dune-part-two-2024",
    "query": "Dune Part Two 2024 Multi 2160p",
    "profile": "pepito-cine",
    "language": "VF"
  }'

# 3. Play selected stream
curl -X POST http://localhost:3000/api/stream/play \
  -H "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..." \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "dune-part-two-2024",
    "selectedStreamTitle": "Dune Part Two · 4K REMUX",
    "alternativeStreamTitles": [...]
  }'
```

### Example 2: Mobile Streaming

```bash
curl -X POST http://localhost:3000/api/stream/select \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "breaking-bad-s04e04",
    "query": "Breaking Bad S04E04 480p",
    "profile": "pepito-du-voyage",
    "language": "VF"
  }'
```

### Example 3: Anime Selection

```bash
curl -X POST http://localhost:3000/api/stream/select \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "naruto-shippuden-s22e42",
    "query": "Naruto Shippuden S22E42 1080p",
    "profile": "pepito-macqueen",
    "isAnime": true
  }'
```

---

## SDK Usage (TypeScript)

```typescript
import StreamService from './services/streamService';
import { QualityProfile } from './services/qualityProfiles';

const streamService = new StreamService();

// Select stream
const result = await streamService.selectStream({
  contentId: 'dune-part-two-2024',
  query: 'Dune Part Two 2024',
  profile: QualityProfile.PEPITO_CINE,
  language: 'VF',
});

console.log(`Selected: ${result.selectedStream.title}`);
console.log(`Score: ${result.score}/100`);
console.log(`Alternatives: ${result.alternativeStreams.length}`);
```

---

**For more info**, see [QUALITY_PROFILES.md](./QUALITY_PROFILES.md) or [ARCHITECTURE.md](./ARCHITECTURE.md)
