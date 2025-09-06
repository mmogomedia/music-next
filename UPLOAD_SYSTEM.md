# File Upload System

This document describes the complete file upload system implementation with R2, Ably realtime, and job processing.

## Architecture Overview

The upload system follows this flow:

1. **User selects file** → Browser gathers `file.name`, `file.type`, `file.size`
2. **Create job** → `POST /api/uploads/init` → Creates DB row with `status: "pending_upload"`
3. **Start realtime** → Ably client with `authUrl: /api/ably/auth?jobId={jobId}`
4. **Upload to R2** → Browser uploads directly to R2 using presigned URL
5. **Complete upload** → `POST /api/uploads/complete` → Updates status to `"uploaded"`

## API Endpoints

### POST /api/uploads/init
Creates a new upload job and returns presigned URL for R2 upload.

**Request:**
```json
{
  "fileName": "song.mp3",
  "fileType": "audio/mpeg",
  "fileSize": 5242880
}
```

**Response:**
```json
{
  "jobId": "uuid",
  "key": "uploads/userId/uuid.mp3",
  "uploadUrl": "https://r2-presigned-url"
}
```

### POST /api/uploads/complete
Notifies backend that upload is complete and triggers processing.

**Request:**
```json
{
  "jobId": "uuid",
  "key": "uploads/userId/uuid.mp3",
  "size": 5242880,
  "mime": "audio/mpeg"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "status": "UPLOADED"
}
```

### GET /api/ably/auth?jobId={jobId}
Returns Ably token for realtime upload progress updates.

**Response:**
```json
{
  "keyName": "your-key",
  "timestamp": 1234567890,
  "nonce": "random",
  "mac": "signature"
}
```

## Database Schema

### UploadJob Model
```prisma
model UploadJob {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  key         String        @unique
  status      UploadStatus  @default(PENDING_UPLOAD)
  fileName    String
  fileType    String
  fileSize    Int
  uploadUrl   String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("upload_jobs")
}

enum UploadStatus {
  PENDING_UPLOAD
  UPLOADED
  PROCESSING
  COMPLETED
  FAILED
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Cloudflare R2 Storage
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="your-bucket-name"
R2_REGION="auto"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"

# Ably Realtime
ABLY_API_KEY="your-ably-api-key"

# Optional: Music Processing Service
PROCESSOR_SERVICE_URL="https://your-processor-service.com"
```

## Frontend Component

The `FileUpload` component handles:
- File selection with drag & drop
- Real-time progress tracking via Ably
- Direct upload to R2 with XHR progress
- Error handling and status updates

## Realtime Updates

The system uses Ably channels for real-time updates:
- Channel: `upload:{jobId}`
- Messages: `progress` and `status` updates
- Reconnection: Uses `?rewind=1` to get last message on reconnect

## Security

- File type validation (MP3, WAV, FLAC, M4A, AAC)
- File size limits (100MB max)
- User authentication required
- Job ownership verification
- Presigned URLs with 1-hour expiration

## Next Steps

1. Set up Cloudflare R2 bucket
2. Configure Ably account
3. Implement music processing service
4. Add file validation and virus scanning
5. Add upload retry logic
6. Implement upload queue management
