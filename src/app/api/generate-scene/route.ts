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

    const { prompt } = await req.json()
    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    // Default enhanced aesthetic background prompt for ecommerce
    const aestheticPrompt = `${prompt}, professional commercial studio product background photography, soft clean studio lighting, minimalist podium, hyper-realistic, 8k resolution, elegant, bokeh background`

    // Call Hugging Face Inference API for text-to-image scene generation
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: aestheticPrompt,
          parameters: {
            negative_prompt: 'ugly, deformed, disfigured, poor details, bad anatomy, low quality, watermark, text, signature',
          },
        }),
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
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error: any) {
    console.error('Error in generate-scene route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
