import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'HUGGINGFACE_API_KEY is not configured on the server' },
        { status: 500 }
      )
    }

    let imageBuffer: ArrayBuffer

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const { imageUrl } = await req.json()
      if (!imageUrl) {
        return NextResponse.json(
          { error: 'imageUrl is required' },
          { status: 400 }
        )
      }

      // Fetch the raw image from the given URL
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch image from provided imageUrl' },
          { status: 400 }
        )
      }
      imageBuffer = await imgRes.arrayBuffer()
    } else {
      // Direct binary or formData
      const formData = await req.formData()
      const file = formData.get('image') as File | null
      if (!file) {
        return NextResponse.json(
          { error: 'No image file provided in form data' },
          { status: 400 }
        )
      }
      imageBuffer = await file.arrayBuffer()
    }

    // Call Hugging Face Inference API for background removal
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      }
    )

    if (!hfResponse.ok) {
      const errText = await hfResponse.text()
      return NextResponse.json(
        { error: `Hugging Face API error (${hfResponse.status}): ${errText}` },
        { status: hfResponse.status }
      )
    }

    const resultBuffer = await hfResponse.arrayBuffer()

    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error: any) {
    console.error('Error in remove-bg route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
