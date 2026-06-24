import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { generateProductId } from '@/lib/utils/productIdGenerator';
import { Vendor } from '@/lib/models/Vendor';
import jwt from 'jsonwebtoken';

const VENDOR_CATEGORY_MAP = {
  'Generic Medicine': [
    'Antibiotics',
    'Pain Relief',
    'Acidity',
    'Diabetes',
    'Allergy',
    'Heart Care',
    'Vitamins',
    'Cardiac',
    'Supplements',
    'Gastric',
  ],
  'Ayurveda Medicine': [
    'Immunity',
    'Digestion',
    'Stress Relief',
    'Energy',
    'Skin & Hair',
    'Weight Management',
    'Joint & Bone',
    "Women's Health",
    "Men's Health",
  ],
  Homeopathy: [
    'Cold & Flu',
    'Skin',
    'Digestive',
    'Mental Wellness',
    'Joint & Pain',
    "Women's Health",
    'Immunity',
    'Children',
  ],
  'Lab Tests': [
    'General',
    'Diabetes',
    'Cardiac',
    'Thyroid',
    'Liver',
    'Kidney',
    'Vitamins',
    'Infection',
    'Women',
  ],
  Nutrition: [
    'Sports Nutrition',
    'Health Food & Drinks',
    'Vitamin & Dietary Supplements',
    'Organic Products',
    'Green Teas',
    'Digestives',
  ],
  'Personal Care': [
    'Aroma Oils',
    'Mens Grooming',
    'Female Care',
    'Skin Care',
    'Bath & Shower',
    'Hair Care',
    'Elderly Care',
    'Mosquito Repellents',
    'Oral Care',
  ],
  Fitness: [
    'Supports & Splints',
    'Health Devices',
    'Fitness Equipment',
    'Hospital Supplies',
    'Aroma Therapy',
    'Disability Aids',
    'Massagers',
    'Bandages & Tapes',
    'Walking Sticks',
  ],
  'Sexual Wellness': [
    'Supplements',
    'Condoms',
  ],
  Unani: [
    'Unani Medicines',
    'Habbe & Qurs',
    'Majun & Jawarish',
    'Safoof, Labub & Kushta',
    'Sharbat, Sirka & Arq',
    'Lauq & Saoot',
    'Khamira & Itrifal',
    'Roghan & Oils',
    'Unani Brands',
  ],
  'Baby Care': [
    'Tonics & Supplements',
    'Bath & Skin',
    'Wipes & Diapers',
    'Gift Packs',
  ],
} as const;

type VendorProductType = keyof typeof VENDOR_CATEGORY_MAP;

function isVendorProductType(value: string): value is VendorProductType {
  return Object.prototype.hasOwnProperty.call(VENDOR_CATEGORY_MAP, value);
}

function isCloudinaryImageUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\/res\.cloudinary\.com\//i.test(url.trim());
}

function inferProductTypeFromCategory(category?: string): VendorProductType | null {
  if (!category) return null;
  const normalized = category.trim().toLowerCase();
  if (normalized === 'generic' || normalized === 'branded') return 'Generic Medicine';
  if (normalized === 'ayurvedic' || normalized === 'ayurveda') return 'Ayurveda Medicine';
  if (normalized === 'homeopathy') return 'Homeopathy';
  if (normalized === 'lab tests' || normalized === 'lab-tests' || normalized === 'labtest') return 'Lab Tests';

  for (const [type, categories] of Object.entries(VENDOR_CATEGORY_MAP)) {
    if ((categories as readonly string[]).includes(category)) {
      return type as VendorProductType;
    }
  }
  return null;
}

function normalizeCategoryForType(productType: VendorProductType, category?: string): string {
  const raw = (category || '').trim();
  const normalized = raw.toLowerCase();
  const categories = VENDOR_CATEGORY_MAP[productType] || VENDOR_CATEGORY_MAP['Generic Medicine'];

  if (productType === 'Generic Medicine' && (normalized === 'generic' || normalized === 'branded')) {
    return categories[0];
  }

  if (productType === 'Ayurveda Medicine' && (normalized === 'ayurvedic' || normalized === 'ayurveda')) {
    return categories[0];
  }

  if (productType === 'Homeopathy' && normalized === 'homeopathy') {
    return categories[0];
  }

  if (productType === 'Lab Tests' && (normalized === 'lab tests' || normalized === 'lab-tests' || normalized === 'labtest')) {
    return categories[0];
  }

  const exactMatch = categories.find((c) => c.toLowerCase() === normalized);
  return exactMatch || raw;
}

function resolveTypeAndCategory(productType: string | undefined, category: string) {
  const rawType = (productType || '').trim();
  const rawCategory = (category || '').trim();
  const inferredType = inferProductTypeFromCategory(rawCategory);
  const resolvedType: VendorProductType = isVendorProductType(rawType)
    ? (rawType as VendorProductType)
    : (inferredType || 'Generic Medicine');

  const normalizedCategory = normalizeCategoryForType(resolvedType, rawCategory) || rawCategory;

  return { resolvedType, normalizedCategory };
}

// Verify vendor token
async function verifyVendorToken(authHeader?: string): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  const token = authHeader.slice(7);
  const secret = process.env.VENDOR_JWT_SECRET || 'vendor-secret-key';
  
  try {
    const decoded: any = jwt.verify(token, secret);
    return decoded.vendorId || decoded.id;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify vendor authentication
    const authHeader = request.headers.get('authorization');
    const vendorIdFromToken = await verifyVendorToken(authHeader ?? undefined);
    
    const body = await request.json();
    const { vendorId, products } = body;

    // Validate vendor ID
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Check token vendor matches request vendor
    if (vendorIdFromToken && vendorIdFromToken !== vendorId) {
      return NextResponse.json(
        { error: 'Unauthorized: Token vendor does not match request vendor' },
        { status: 403 }
      );
    }

    // Validate products array
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Products array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Verify vendor exists and is verified
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    if (vendor.status !== 'verified') {
      return NextResponse.json(
        { error: 'Your vendor account is not verified' },
        { status: 403 }
      );
    }

    const successful: any[] = [];
    const failed: any[] = [];

    console.log(`Processing ${products.length} products for vendor ${vendorId}`);
    
    // Helper function to find field value with multiple possible column names
    const getFieldValue = (obj: any, possibleNames: string[]): any => {
      for (const name of possibleNames) {
        if (obj.hasOwnProperty(name)) {
          return obj[name];
        }
      }
      return undefined;
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Log the actual keys in the product object for debugging
      if (i === 0) {
        console.log(`Row 2 - Available columns:`, Object.keys(product));
        console.log(`Row 2 - Raw data:`, product);
      }

      try {
        // Support multiple column name variations
        const name = String(getFieldValue(product, ['name', 'Name', 'product_name', 'productName', 'Product Name', 'Product_Name', 'PRODUCT NAME', 'NAME']) || '').trim();
        const category = String(getFieldValue(product, ['category', 'Category', 'product_category', 'productCategory', 'Product Category', 'CATEGORY']) || '').trim();
        
        // Price: required and must be valid
        const priceValue = getFieldValue(product, ['price', 'Price', 'product_price', 'productPrice', 'Product Price', 'PRICE']);
        const price = priceValue !== undefined && priceValue !== null && priceValue !== '' 
          ? Number(priceValue) 
          : undefined;
        
        // USD Price: optional but if provided must be valid
        const usdPriceValue = getFieldValue(product, ['usdPrice', 'usd_price', 'USD Price', 'usd-price', 'USDPrice', 'USD_PRICE']);
        const usdPrice = usdPriceValue !== undefined && usdPriceValue !== null && usdPriceValue !== '' 
          ? Number(usdPriceValue) 
          : undefined;
        
        const images = getFieldValue(product, ['images', 'Images', 'image', 'Image', 'product_images', 'productImages']) || [];

        console.log(`Row ${i + 2}: name="${name}", category="${category}", price=${price}, usdPrice=${usdPrice}`);

        // Check for missing or invalid values
        if (!name) {
          failed.push({
            row: i + 2,
            error: `Product name is required. Expected column names: 'name', 'Name', 'Product Name', 'productName', etc. Found columns: ${Object.keys(product).join(', ')}`,
            data: product,
          });
          continue;
        }

        if (!category) {
          failed.push({
            row: i + 2,
            error: `Category is required. Expected column names: 'category', 'Category', 'Product Category', etc. Found columns: ${Object.keys(product).join(', ')}`,
            data: product,
          });
          continue;
        }

        if (price === undefined) {
          failed.push({
            row: i + 2,
            error: 'Price is required',
            data: product,
          });
          continue;
        }

        if (isNaN(price) || price < 0) {
          failed.push({
            row: i + 2,
            error: `Price must be a valid positive number, got: ${product.price}`,
            data: product,
          });
          continue;
        }

        if (usdPrice !== undefined && (isNaN(usdPrice) || usdPrice < 0)) {
          failed.push({
            row: i + 2,
            error: `USD Price must be a valid positive number, got: ${product.usdPrice}`,
            data: product,
          });
          continue;
        }

        // Image validation - images are optional for bulk upload but Cloudinary URLs are preferred
        let hasValidImage = false;
        let primaryImage = '';

        if (Array.isArray(images)) {
          for (const img of images) {
            if (isCloudinaryImageUrl(img)) {
              primaryImage = img;
              hasValidImage = true;
              break;
            }
          }
        } else if (typeof images === 'string' && isCloudinaryImageUrl(images)) {
          primaryImage = images;
          hasValidImage = true;
        }

        // For bulk upload, we allow products without images (vendors can add them later)
        // But we still log a warning if images are missing
        const imageWarning = !hasValidImage && (Array.isArray(images) ? images.length > 0 : images) 
          ? ` (Warning: Image URLs provided but not in Cloudinary format. Using empty for now - please add images manually)`
          : !hasValidImage ? ' (No images provided - you can add images to the product later)' : '';

        const { resolvedType, normalizedCategory } = resolveTypeAndCategory(
          getFieldValue(product, ['productType', 'product_type', 'ProductType', 'Product Type', 'type', 'Type']),
          category
        );

        console.log(`Row ${i + 2}: Resolved productType="${resolvedType}", normalizedCategory="${normalizedCategory}"`);

        // Prepare product data
        const productId = await generateProductId();
        const stockValue = getFieldValue(product, ['stock', 'Stock', 'quantity', 'Quantity', 'qty', 'QTY']) ?? 0;
        const stock = Number(stockValue);
        const mrpValue = getFieldValue(product, ['mrp', 'MRP', 'MRP Price', 'mrp_price']);
        const mrp = mrpValue ? Number(mrpValue) : undefined;
        const description = String(getFieldValue(product, ['description', 'Description', 'desc', 'Desc', 'product_description', 'productDescription']) || '').trim();
        const brand = String(getFieldValue(product, ['brand', 'Brand', 'manufacturer', 'Manufacturer', 'product_brand', 'productBrand']) || '').trim();

        // Handle image URLs (multiple images support)
        const imageUrls = Array.isArray(images)
          ? images.filter((img: any) => isCloudinaryImageUrl(img))
          : isCloudinaryImageUrl(images)
            ? [images]
            : [];

        // Ensure we have at least the primary image
        const finalImages = imageUrls.length > 0 ? imageUrls : (primaryImage ? [primaryImage] : []);

        console.log(`Row ${i + 2}: Creating product with: name="${name}", category="${normalizedCategory}", price=${price}, usdPrice=${usdPrice}, images=${finalImages.length}`);

        const createdProduct = await Product.create({
          _id: productId,
          vendorId,
          name,
          brand: brand || undefined,
          category: normalizedCategory,
          productType: resolvedType,
          price,
          ...(usdPrice !== undefined && { usdPrice }),
          mrp,
          stock,
          description: description || undefined,
          image: primaryImage || undefined,
          images: finalImages.slice(0, 4), // Max 4 images
          isActive: true,
          approvalStatus: 'pending',
          requiresPrescription: String(getFieldValue(product, ['requiresPrescription', 'requires_prescription', 'prescription', 'Prescription', 'Requires Prescription']) || '')
            .toLowerCase()
            .startsWith('y'),
        });

        successful.push({
          ...createdProduct.toObject(),
          warning: imageWarning
        });
      } catch (err: any) {
        console.error(`Bulk upload error for row ${i + 2}:`, err);
        const errorMessage = err.message || 'Failed to create product';
        const mongooseErrors = err.errors ? Object.entries(err.errors).map(([field, error]: any) => `${field}: ${error.message || error}`).join('; ') : undefined;
        
        failed.push({
          row: i + 2,
          error: mongooseErrors ? `${errorMessage} (${mongooseErrors})` : errorMessage,
          data: product,
        });
      }
    }

    return NextResponse.json(
      {
        successful: successful.length,
        failed: failed.length,
        errors: failed,
        message: `Bulk upload completed: ${successful.length} successful, ${failed.length} failed`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Vendor bulk upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Bulk upload failed' },
      { status: 500 }
    );
  }
}
