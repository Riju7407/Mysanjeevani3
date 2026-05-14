import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product } from '@/lib/models/Product';
import { generateProductId } from '@/lib/utils/productIdGenerator';
import * as XLSX from 'xlsx';

function normalizeHeaderKey(key: string) {
  return key.trim().toLowerCase();
}

function mapRowToProduct(row: Record<string, any>) {
  // normalize keys to lowercase for flexible column names
  const mapped: Record<string, any> = {};
  for (const k of Object.keys(row)) mapped[normalizeHeaderKey(k)] = row[k];

  const name = mapped['name'] || mapped['product name'] || mapped['product'] || '';
  const brand = mapped['brand'] || mapped['manufacturer'] || '';
  const category = mapped['category'] || mapped['cat'] || '';
  const price = Number(mapped['price'] ?? mapped['mrp'] ?? 0) || 0;
  const usdPrice = Number(mapped['usdprice'] ?? mapped['usd'] ?? mapped['dollar price'] ?? 0) || 0;
  const mrp = Number(mapped['mrp'] ?? mapped['maximum retail price'] ?? 0) || undefined;
  const stock = Number(mapped['stock'] ?? mapped['quantity'] ?? 0) || 0;
  const description = mapped['description'] || mapped['desc'] || '';
  const images = (mapped['images'] || mapped['image urls'] || mapped['image'] || '') ? String(mapped['images'] || mapped['image urls'] || mapped['image']).split(/[,;|\n]+/).map((s: string) => s.trim()).filter(Boolean) : [];
  const productType = mapped['producttype'] || mapped['type'] || 'Generic Medicine';
  const requiresPrescription = String(mapped['requiresprescription'] || mapped['rx'] || mapped['prescription'] || '').toLowerCase().startsWith('y');

  return {
    name: String(name).trim(),
    brand: String(brand).trim() || undefined,
    category: String(category).trim() || undefined,
    price: Number(price),
    usdPrice: Number(usdPrice),
    mrp: mrp ? Number(mrp) : undefined,
    stock: Number(stock),
    description: description || undefined,
    images,
    productType,
    requiresPrescription,
    isActive: true,
    approvalStatus: 'approved',
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const form = await request.formData();
    const file = form.get('file') as any;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(Buffer.from(buffer), { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const created: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const product = mapRowToProduct(row);

      // Basic validation
      if (!product.name || !product.category || !product.price || !product.usdPrice) {
        errors.push({ row: i + 2, error: 'Missing required fields (name, category, price, usdPrice)', data: row });
        continue;
      }

      try {
        // Generate a numeric product ID
        const productId = await generateProductId();
        const createdProduct = await Product.create({
          _id: productId,
          ...product,
        });
        created.push(createdProduct);
      } catch (err: any) {
        errors.push({ row: i + 2, error: err.message || 'DB error' });
      }
    }

    return NextResponse.json({ success: true, created: created.length, errors }, { status: 201 });
  } catch (error) {
    console.error('Bulk upload failed:', error);
    return NextResponse.json({ error: 'Bulk upload failed' }, { status: 500 });
  }
}
