import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId, key, size, mime } = await request.json()

    if (!jobId || !key || !size || !mime) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, key, size, mime' },
        { status: 400 }
      )
    }

    // Verify the job belongs to the user
    const uploadJob = await prisma.uploadJob.findFirst({
      where: {
        id: jobId,
        userId: session.user.id,
        key,
      },
    })

    if (!uploadJob) {
      return NextResponse.json(
        { error: 'Upload job not found' },
        { status: 404 }
      )
    }

    // Update job status to uploaded
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: {
        status: 'UPLOADED',
        fileSize: size,
        fileType: mime,
      },
    })

    // TODO: Call your processor service here
    // This would be an HTTP call to your music processing service
    // await fetch(`${process.env.PROCESSOR_SERVICE_URL}/process`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ jobId, key, userId: session.user.id }),
    // })

    // For now, we'll simulate the processor call
    console.log(`Processing job ${jobId} for user ${session.user.id} with key ${key}`)

    return NextResponse.json({
      success: true,
      jobId,
      status: 'UPLOADED',
    })
  } catch (error) {
    console.error('Upload complete error:', error)
    return NextResponse.json(
      { error: 'Failed to complete upload' },
      { status: 500 }
    )
  }
}
