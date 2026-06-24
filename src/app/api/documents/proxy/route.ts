import { NextRequest, NextResponse } from 'next/server';

const fetchDocument = async (documentUrl: string) => {
  const response = await fetch(documentUrl, {
    headers: {
      'User-Agent': 'My-Sanjeevani-Server/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cloudinaryUrl = searchParams.get('url');

    if (!cloudinaryUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate that the URL is from Cloudinary to prevent abuse
    if (!cloudinaryUrl.includes('res.cloudinary.com')) {
      return NextResponse.json(
        { error: 'Invalid document URL' },
        { status: 400 }
      );
    }

    try {
      const directResponse = await fetchDocument(cloudinaryUrl);
      const buffer = await directResponse.arrayBuffer();
      const contentType = directResponse.headers.get('content-type') || 'application/pdf';

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'inline; filename="document.pdf"',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (directError: any) {
      console.error('Direct document fetch failed:', directError.message);

      try {
        const normalizedUrl = cloudinaryUrl.includes('/image/upload/') && cloudinaryUrl.toLowerCase().endsWith('.pdf')
          ? cloudinaryUrl.replace('/image/upload/', '/raw/upload/')
          : cloudinaryUrl;

        if (normalizedUrl !== cloudinaryUrl) {
          const fallbackResponse = await fetchDocument(normalizedUrl);
          const buffer = await fallbackResponse.arrayBuffer();
          const contentType = fallbackResponse.headers.get('content-type') || 'application/pdf';

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': 'inline; filename="document.pdf"',
              'Cache-Control': 'public, max-age=3600',
            },
          });
        }
      } catch (fallbackError: any) {
        console.error('Fallback document fetch failed:', fallbackError.message);
      }

      return NextResponse.json(
        { error: 'Failed to process document: ' + directError.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Document proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy document: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
