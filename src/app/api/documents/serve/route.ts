import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/{cloud}/raw/upload/v{version}/{public_id}
      const urlObj = new URL(cloudinaryUrl);
      const pathParts = urlObj.pathname.split('/').filter((p) => p);

      // Find 'upload' in path
      const uploadIndex = pathParts.indexOf('upload');
      if (uploadIndex === -1 || uploadIndex + 1 >= pathParts.length) {
        throw new Error('Invalid Cloudinary URL format');
      }

      // Get everything after 'upload'
      let remainingParts = pathParts.slice(uploadIndex + 1);

      // Skip version part if it exists (v1234567890)
      if (remainingParts[0]?.startsWith('v')) {
        remainingParts = remainingParts.slice(1);
      }

      if (remainingParts.length === 0) {
        throw new Error('Could not extract public_id from URL');
      }

      // Join and remove file extension
      let publicId = remainingParts.join('/');
      publicId = publicId.replace(/\.[^.]+$/, ''); // Remove extension

      console.log('Extracted publicId:', publicId);

      // Use Cloudinary SDK to fetch with proper authentication
      try {
        // First, try to get the resource with Cloudinary API
        const adminApi = cloudinary;
        
        // Generate authenticated URL
        const authenticatedUrl = adminApi.url(publicId, {
          secure: true,
          resource_type: 'raw',
          type: 'upload',
        });

        console.log('Generated authenticated URL:', authenticatedUrl);

        // Fetch using the authenticated URL
        const response = await fetch(authenticatedUrl, {
          headers: {
            'User-Agent': 'My-Sanjeevani-Server/1.0',
            'Accept': '*/*',
          },
        });

        if (!response.ok) {
          console.error(`Fetch failed: ${response.status} ${response.statusText}`);
          throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/pdf';

        console.log('Document fetched successfully, size:', buffer.byteLength);

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': 'inline; filename="document.pdf"',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      } catch (error: any) {
        console.error('Error with Cloudinary SDK approach:', error.message);
        
        // Fallback: Try direct URL fetch
        console.log('Trying direct fetch as fallback...');
        const directResponse = await fetch(cloudinaryUrl, {
          headers: {
            'User-Agent': 'My-Sanjeevani-Server/1.0',
            'Accept': '*/*',
          },
        });

        if (!directResponse.ok) {
          console.error(`Direct fetch failed: ${directResponse.status}`);
          return NextResponse.json(
            { error: `Failed to fetch document: ${directResponse.statusText}` },
            { status: directResponse.status }
          );
        }

        const buffer = await directResponse.arrayBuffer();
        const contentType = directResponse.headers.get('content-type') || 'application/pdf';

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': 'inline; filename="document.pdf"',
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
    } catch (urlError: any) {
      console.error('URL processing error:', urlError.message);
      return NextResponse.json(
        { error: 'Failed to process document URL: ' + urlError.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Document serving error:', error);
    return NextResponse.json(
      { error: 'Failed to serve document: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
