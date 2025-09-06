# Music Upload System

## 🎯 Overview

A complete file upload system for Flemoji that handles music file uploads with real-time progress tracking, cloud storage, and database integration. The system uses a hybrid approach combining direct browser uploads with server-side processing to avoid CORS issues while maintaining security and control.

## 🏗️ Architecture

### **Current Implementation: Hybrid Upload Flow**

```
User → FileUpload Component → Next.js API → Cloudflare R2 → Database
  ↓           ↓                    ↓           ↓            ↓
Select    Real-time           Server-side   Cloud        Track
File      Progress            Upload        Storage      Creation
```

### **System Components**

1. **Frontend**: `FileUpload` component with drag & drop
2. **API Layer**: Next.js API routes for upload management
3. **Storage**: Cloudflare R2 for file storage
4. **Database**: PostgreSQL with Prisma ORM
5. **Real-time**: Ably for progress updates
6. **Processing**: Server-side file handling

## 🔄 Upload Flow

### **Step 1: Initialize Upload**

```typescript
POST /api/uploads/init
{
  "fileName": "song.mp3",
  "fileType": "audio/mpeg",
  "fileSize": 5242880
}
```

**Response:**

```json
{
  "jobId": "cmf8bhi0n00058km0u8u476ef",
  "key": "uploads/userId/uuid.mp3",
  "uploadUrl": "https://r2-presigned-url"
}
```

### **Step 2: Real-time Connection**

```typescript
GET /api/ably/auth?jobId={jobId}
```

**Response:**

```json
{
  "keyName": "your-key",
  "timestamp": 1234567890,
  "nonce": "random",
  "mac": "signature"
}
```

### **Step 3: Server-side Upload**

```typescript
POST / api / uploads / server - upload;
FormData: {
  (file, jobId, uploadUrl, key);
}
```

**Process:**

- Validates job ownership
- Uploads file to R2 using presigned URL
- Updates job status to `UPLOADED`

### **Step 4: Complete Upload**

```typescript
POST /api/uploads/complete
{
  "jobId": "uuid",
  "key": "uploads/userId/uuid.mp3",
  "size": 5242880,
  "mime": "audio/mpeg"
}
```

**Process:**

- Creates `Track` record in database
- Updates job status to `COMPLETED`
- Returns track information

## 📊 Database Schema

### **UploadJob Model**

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

### **Track Model**

```prisma
model Track {
  id            String    @id @default(cuid())
  title         String
  artistId      String
  artist        User      @relation(fields: [artistId], references: [id], onDelete: Cascade)
  fileUrl       String
  coverImageUrl String?
  genre         String
  album         String?
  description   String?
  duration      Int
  playCount     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  playEvents    PlayEvent[]
  smartLinks    SmartLink[]

  @@map("tracks")
}
```

## 🔧 API Endpoints

### **POST /api/uploads/init**

- **Purpose**: Initialize upload job and get presigned URL
- **Auth**: Required
- **Validation**: File type, size limits
- **Response**: `{ jobId, key, uploadUrl }`

### **POST /api/uploads/server-upload**

- **Purpose**: Handle file upload via server (avoids CORS)
- **Auth**: Required
- **Input**: FormData with file, jobId, uploadUrl, key
- **Process**: Upload to R2, update job status

### **POST /api/uploads/complete**

- **Purpose**: Mark upload complete and create track record
- **Auth**: Required
- **Input**: `{ jobId, key, size, mime }`
- **Process**: Create Track record, update job status

### **GET /api/ably/auth**

- **Purpose**: Get Ably token for real-time updates
- **Auth**: Required
- **Input**: `jobId` query parameter
- **Response**: Ably authentication token

### **GET /api/tracks**

- **Purpose**: Fetch user's tracks
- **Auth**: Required
- **Response**: Array of user's tracks

## 🎨 Frontend Components

### **FileUpload Component**

```typescript
interface FileUploadProps {
  onUploadComplete?: (jobId: string) => void;
}
```

**Features:**

- Drag & drop file selection
- Real-time progress tracking via Ably
- File validation (type, size)
- Error handling and status updates
- Auto-refresh after successful upload

**Supported Formats:**

- MP3, WAV, FLAC, M4A, AAC
- Maximum size: 100MB

## ⚙️ Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/flemoji"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudflare R2
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_AUDIO_BUCKET_NAME="your-audio-bucket-name"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://your-bucket.your-domain.com"

# Ably
ABLY_API_KEY="your-ably-api-key"
```

## 🔒 Security Features

- **Authentication**: All endpoints require valid session
- **File Validation**: Type and size restrictions
- **Job Ownership**: Users can only access their own uploads
- **Presigned URLs**: Time-limited access to R2
- **CORS Protection**: Server-side uploads avoid browser CORS issues

## 📈 Real-time Updates

### **Ably Integration**

- **Channel**: `upload:{jobId}`
- **Messages**: `progress` and `status` updates
- **Reconnection**: Uses `?rewind=1` for message history
- **Authentication**: Token-based via `/api/ably/auth`

### **Progress Tracking**

- Upload progress percentage
- Status updates (initializing, uploading, processing, complete)
- Error notifications
- Real-time UI updates

## 🚀 Deployment Considerations

### **Vercel Limitations**

- Serverless functions have execution time limits
- File uploads go through server (bandwidth usage)
- Consider file size limits for serverless

### **Scaling Options**

- Move to direct R2 uploads for high volume
- Implement background processing for large files
- Add CDN for file delivery
- Consider dedicated upload service

## 🔄 Error Handling

### **Client-side**

- File validation errors
- Network connectivity issues
- Upload progress failures
- User-friendly error messages

### **Server-side**

- Authentication failures
- File validation errors
- R2 upload failures
- Database errors
- Job status updates

## 📝 File Structure

```
src/
├── components/upload/
│   └── FileUpload.tsx              # Main upload component
├── app/api/uploads/
│   ├── init/route.ts               # Initialize upload
│   ├── server-upload/route.ts      # Server-side upload
│   └── complete/route.ts           # Complete upload
├── app/api/ably/
│   └── auth/route.ts               # Ably authentication
└── app/api/tracks/
    └── route.ts                    # Fetch user tracks
```

## 🎯 Benefits of Current Approach

### **Advantages**

- ✅ **No CORS issues** - Server handles R2 communication
- ✅ **Better security** - Files go through server first
- ✅ **Real-time updates** - Ably integration for progress
- ✅ **Database integration** - Automatic track creation
- ✅ **Error handling** - Comprehensive error management
- ✅ **File validation** - Type and size restrictions
- ✅ **User experience** - Drag & drop with progress

### **Trade-offs**

- ⚠️ **Server bandwidth** - Files pass through server
- ⚠️ **Processing time** - Double upload (client→server→R2)
- ⚠️ **Vercel limits** - Serverless function constraints

## 🔮 Future Enhancements

1. **Audio Processing**: Extract metadata, generate waveforms
2. **Image Processing**: Generate album art thumbnails
3. **Virus Scanning**: Security validation
4. **Batch Uploads**: Multiple file support
5. **Resume Uploads**: Handle network interruptions
6. **Direct Uploads**: High-volume optimization
7. **CDN Integration**: Faster file delivery

## 📋 Testing Checklist

- [ ] File selection and validation
- [ ] Upload progress tracking
- [ ] Real-time updates via Ably
- [ ] Database record creation
- [ ] Error handling scenarios
- [ ] Authentication requirements
- [ ] File type restrictions
- [ ] Size limit enforcement
- [ ] UI refresh after upload
- [ ] Track display in library

---

This system provides a robust, user-friendly music upload experience with real-time feedback and secure cloud storage integration. 🎵✨
