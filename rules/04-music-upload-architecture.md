# Music Upload Architecture: Background Processing System

## 🎯 Objective
Implement a robust, scalable music upload system using background processing with real-time progress updates, designed for Vercel deployment with external worker services.

## 🏗️ Architecture Overview

### **Core Principle: Non-Blocking Uploads**
- **Frontend**: Submits form, receives job ID, listens for progress
- **Vercel API**: Accepts file, creates job, returns immediately
- **Background Worker**: Handles actual upload and processing
- **Real-time Updates**: Progress and completion notifications

### **System Components**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Vercel API    │    │  Background     │
│   (Next.js)     │    │   (Next.js)     │    │   Worker        │
│                 │    │                 │    │                 │
│ 1. Submit Form  │───▶│ 2. Create Job   │───▶│ 3. Process      │
│ 4. Listen       │◀───│ 5. Return ID    │    │    Upload       │
│    Progress     │    │                 │    │ 6. Emit Events  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   RabbitMQ      │    │  Object Storage │
         │              │   (Queue)       │    │  (S3/R2/etc.)   │
         │              └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Real-time      │    │  Event          │
│  Notifications  │◀───│  Broadcasting   │
│  (Ably/Pusher)  │    │  (RabbitMQ)     │
└─────────────────┘    └─────────────────┘
```

## 🔄 Event Flow

### **1. Upload Initiation**
```
Client → POST /api/uploads/init
├── Stream file to temporary storage
├── Create job { jobId, tempKey, userId, metadata }
├── Publish to RabbitMQ: uploads.init
└── Return { jobId, channelToken }
```

### **2. Background Processing**
```
Worker consumes uploads.init
├── Copy from staging → final storage
├── Validate file (MIME, size, virus scan)
├── Extract metadata (duration, bitrate, etc.)
├── Generate waveform data
├── Emit progress events
└── Emit completion event
```

### **3. Real-time Updates**
```
Client subscribes to upload:{jobId}
├── Receives progress updates
├── Updates UI progress bar
├── Shows processing status
└── Displays final result
```

## 🛠️ Implementation Options

### **Option A: Temp Holding (Recommended for <200MB)**
**Best for**: Typical music files, simpler architecture

```typescript
// Vercel API Route
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Stream to staging bucket immediately
  const tempKey = await streamToStaging(file)
  
  // Create job
  const jobId = generateJobId()
  const job = {
    jobId,
    tempKey,
    userId: session.user.id,
    metadata: {
      filename: file.name,
      size: file.size,
      mimeType: file.type
    }
  }
  
  // Queue job
  await publishToQueue('uploads.init', job)
  
  return Response.json({ 
    jobId, 
    channelToken: generateChannelToken(jobId) 
  })
}
```

### **Option B: Direct Upload Service (For Large Files)**
**Best for**: Multi-GB files, resumable uploads, weak networks

```typescript
// Vercel API Route
export async function POST(request: Request) {
  const { metadata } = await request.json()
  
  const jobId = generateJobId()
  const uploadUrl = `${UPLOAD_SERVICE_URL}/upload/${jobId}`
  
  // Create job
  const job = {
    jobId,
    uploadUrl,
    userId: session.user.id,
    metadata
  }
  
  await publishToQueue('uploads.init', job)
  
  return Response.json({ 
    jobId, 
    uploadUrl,
    channelToken: generateChannelToken(jobId) 
  })
}
```

## 📦 Technology Stack

### **Core Services**
- **Frontend**: Next.js (Vercel)
- **Queue**: RabbitMQ (CloudAMQP/RabbitMQ Cloud)
- **Worker**: Node.js (Fly.io/Render/Railway)
- **Storage**: AWS S3/Cloudflare R2/Supabase Storage
- **Real-time**: Ably/Pusher/Supabase Realtime

### **Alternative Stacks**

#### **Stack 1: AWS Focused**
- **Queue**: AWS SQS
- **Worker**: AWS Lambda + S3
- **Storage**: AWS S3
- **Real-time**: AWS API Gateway WebSocket

#### **Stack 2: Supabase Focused**
- **Queue**: Supabase Edge Functions + Database
- **Worker**: Supabase Edge Functions
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

#### **Stack 3: Vercel + External**
- **Queue**: RabbitMQ Cloud
- **Worker**: Fly.io
- **Storage**: Cloudflare R2
- **Real-time**: Ably

## 🔧 Implementation Details

### **RabbitMQ Topology**

```javascript
// Exchanges
const exchanges = {
  uploads: 'uploads',      // direct exchange
  events: 'events'         // topic exchange
}

// Queues
const queues = {
  uploads: 'uploads.q',
  events: 'events.broadcast.q',
  dlq: 'uploads.dlq'
}

// Routing Keys
const routingKeys = {
  init: 'uploads.init',
  progress: 'events.progress',
  done: 'events.done',
  error: 'events.error'
}
```

### **Job Schema**

```typescript
interface UploadJob {
  jobId: string
  userId: string
  tempKey?: string        // Option A: staging location
  uploadUrl?: string      // Option B: direct upload URL
  metadata: {
    filename: string
    size: number
    mimeType: string
    originalName: string
  }
  createdAt: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}
```

### **Event Schema**

```typescript
interface ProgressEvent {
  jobId: string
  progress: number        // 0-100
  status: string         // 'uploading' | 'validating' | 'processing' | 'finalizing'
  message?: string
}

interface CompletionEvent {
  jobId: string
  success: boolean
  url?: string
  metadata?: {
    duration: number
    bitrate: number
    format: string
    waveformData?: string
  }
  error?: string
}
```

## 🎵 Music-Specific Features

### **Audio Processing**
```typescript
// Worker: Audio Analysis
async function analyzeAudio(fileKey: string) {
  // Extract metadata
  const metadata = await extractAudioMetadata(fileKey)
  
  // Generate waveform
  const waveform = await generateWaveform(fileKey)
  
  // Validate format
  const validation = await validateAudioFormat(fileKey)
  
  return {
    duration: metadata.duration,
    bitrate: metadata.bitrate,
    format: metadata.format,
    waveformData: waveform,
    isValid: validation.isValid,
    errors: validation.errors
  }
}
```

### **File Validation**
```typescript
const ALLOWED_FORMATS = [
  'audio/mpeg',      // MP3
  'audio/wav',       // WAV
  'audio/flac',      // FLAC
  'audio/mp4',       // M4A
  'audio/aac'        // AAC
]

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

async function validateFile(file: File) {
  if (!ALLOWED_FORMATS.includes(file.type)) {
    throw new Error('Unsupported file format')
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large')
  }
  
  // Additional validation in worker
  return true
}
```

## 🚀 Frontend Implementation

### **Upload Component**
```typescript
export default function UploadMusic() {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [jobId, setJobId] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setUploadState('uploading')
    
    // 1. Initiate upload
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/uploads/init', {
      method: 'POST',
      body: formData
    })
    
    const { jobId, channelToken } = await response.json()
    setJobId(jobId)
    
    // 2. Subscribe to progress
    const channel = ably.channels.get(`upload:${jobId}`)
    
    channel.subscribe('progress', (message) => {
      setProgress(message.data.progress)
      setUploadState(message.data.status)
    })
    
    channel.subscribe('done', (message) => {
      setUploadState('completed')
      setProgress(100)
      // Handle completion
    })
    
    channel.subscribe('error', (message) => {
      setUploadState('error')
      // Handle error
    })
  }

  return (
    <div>
      {/* Upload UI */}
      <Dropzone onDrop={handleUpload} />
      
      {/* Progress UI */}
      {uploadState !== 'idle' && (
        <ProgressBar 
          progress={progress} 
          status={uploadState}
          jobId={jobId}
        />
      )}
    </div>
  )
}
```

### **Progress Component**
```typescript
interface ProgressBarProps {
  progress: number
  status: string
  jobId: string | null
}

export default function ProgressBar({ progress, status, jobId }: ProgressBarProps) {
  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'uploading': return 'Uploading file...'
      case 'validating': return 'Validating audio...'
      case 'processing': return 'Processing audio...'
      case 'finalizing': return 'Finalizing...'
      case 'completed': return 'Upload complete!'
      case 'error': return 'Upload failed'
      default: return 'Processing...'
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {getStatusMessage(status)}
        </span>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {jobId && (
        <p className="text-xs text-gray-500 mt-2">
          Job ID: {jobId}
        </p>
      )}
    </div>
  )
}
```

## 🔒 Security & Validation

### **File Security**
```typescript
// Worker: Security checks
async function securityChecks(fileKey: string) {
  // Virus scan
  const virusScan = await scanForViruses(fileKey)
  if (!virusScan.clean) {
    throw new Error('File failed security scan')
  }
  
  // MIME type validation
  const actualMime = await detectMimeType(fileKey)
  if (!ALLOWED_FORMATS.includes(actualMime)) {
    throw new Error('Invalid file type detected')
  }
  
  // File size validation
  const size = await getFileSize(fileKey)
  if (size > MAX_FILE_SIZE) {
    throw new Error('File exceeds size limit')
  }
}
```

### **Access Control**
```typescript
// API Route: Authentication
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  if (session.user.role !== 'ARTIST') {
    return Response.json({ error: 'Artist role required' }, { status: 403 })
  }
  
  // Continue with upload...
}
```

## 📊 Monitoring & Observability

### **Job Status API**
```typescript
// GET /api/uploads/status?jobId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  
  if (!jobId) {
    return Response.json({ error: 'Job ID required' }, { status: 400 })
  }
  
  const job = await getJobStatus(jobId)
  
  return Response.json({
    jobId,
    status: job.status,
    progress: job.progress,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error
  })
}
```

### **Error Handling**
```typescript
// Worker: Error handling with retry
async function processUpload(job: UploadJob) {
  try {
    await publishProgress(job.jobId, 0, 'starting')
    
    // Process upload
    const result = await uploadToStorage(job)
    
    await publishProgress(job.jobId, 100, 'completed')
    await publishCompletion(job.jobId, result)
    
  } catch (error) {
    await publishError(job.jobId, error.message)
    
    // Retry logic
    if (job.retryCount < MAX_RETRIES) {
      await scheduleRetry(job)
    } else {
      await moveToDLQ(job)
    }
  }
}
```

## 🚀 Deployment Strategy

### **Vercel Configuration**
```json
// vercel.json
{
  "functions": {
    "src/app/api/uploads/init/route.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "RABBITMQ_URL": "@rabbitmq-url",
    "STORAGE_BUCKET": "@storage-bucket",
    "ABLY_API_KEY": "@ably-api-key"
  }
}
```

### **Worker Deployment**
```dockerfile
# Dockerfile for worker
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
CMD ["npm", "start"]
```

### **Environment Variables**
```bash
# Vercel
RABBITMQ_URL=amqp://user:pass@host:port/vhost
STORAGE_BUCKET=your-bucket-name
ABLY_API_KEY=your-ably-key

# Worker
RABBITMQ_URL=amqp://user:pass@host:port/vhost
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
ABLY_API_KEY=your-ably-key
```

## 📈 Performance Considerations

### **Optimization Strategies**
- **Chunked Uploads**: For large files, implement chunked uploads
- **Compression**: Compress files before upload
- **CDN**: Use CDN for final file delivery
- **Caching**: Cache metadata and waveforms
- **Rate Limiting**: Implement upload rate limiting per user

### **Scalability**
- **Horizontal Scaling**: Multiple worker instances
- **Queue Partitioning**: Partition queues by user or file type
- **Load Balancing**: Distribute worker load
- **Auto-scaling**: Scale workers based on queue depth

## 🎯 Implementation Phases

### **Phase 1: Basic Upload (Week 1)**
- [ ] Set up RabbitMQ
- [ ] Create basic API route
- [ ] Implement simple worker
- [ ] Basic progress updates

### **Phase 2: Enhanced Features (Week 2)**
- [ ] Audio metadata extraction
- [ ] Waveform generation
- [ ] File validation
- [ ] Error handling

### **Phase 3: Production Ready (Week 3)**
- [ ] Security scanning
- [ ] Monitoring and logging
- [ ] Retry mechanisms
- [ ] Performance optimization

### **Phase 4: Advanced Features (Week 4)**
- [ ] Resumable uploads
- [ ] Batch processing
- [ ] Analytics
- [ ] Admin tools

This architecture provides a robust, scalable foundation for your music upload system that can handle high volumes while providing excellent user experience with real-time progress updates.


