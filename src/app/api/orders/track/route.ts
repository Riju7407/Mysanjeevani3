import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order } from '@/lib/models/Order';
import { trackShipment } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ error: 'orderId query param is required' }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Prefer AWB for tracking if available
    try {
      if (order.awbNumber) {
        const track = await trackShipment({ awb: order.awbNumber });
        return NextResponse.json({ tracking: track }, { status: 200 });
      }

      if (order.shiprocketShipmentId) {
        const track = await trackShipment({ shipment_id: order.shiprocketShipmentId });
        return NextResponse.json({ tracking: track }, { status: 200 });
      }

      if (order.shiprocketOrderId) {
        const track = await trackShipment({ order_id: order.shiprocketOrderId });
        return NextResponse.json({ tracking: track }, { status: 200 });
      }

      return NextResponse.json({ error: 'No tracking identifiers available for this order' }, { status: 400 });
    } catch (err: any) {
      console.error('Tracking fetch error:', err?.message || err);
      return NextResponse.json({ error: 'Failed to fetch tracking info' }, { status: 502 });
    }
  } catch (error: any) {
    console.error('Order tracking error:', error?.message || error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
