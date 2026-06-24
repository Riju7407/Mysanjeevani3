/**
 * Order Booking API with SMS Notification
 * Example implementation showing SMS integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendOrderConfirmationSms, sendPaymentSuccessSms } from '@/lib/smsService';

interface OrderRequest {
  phone: string;
  email: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = (await request.json()) as OrderRequest;

    const { phone, email, items, shippingAddress } = body;

    // Validation
    if (!phone || !email || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: phone, email, items' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = String(phone).replace(/\D/g, '');
    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    const fullPhone = normalizedPhone.length === 10 ? `91${normalizedPhone}` : normalizedPhone;

    // Calculate total
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order ID (format: ORD-YYYYMMDD-XXXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `ORD-${dateStr}-${randomStr}`;

    // TODO: Save order to database
    // const order = await Order.create({
    //   orderId,
    //   phone: fullPhone,
    //   email,
    //   items,
    //   shippingAddress,
    //   totalAmount,
    //   status: 'PENDING_PAYMENT',
    //   createdAt: new Date(),
    // });

    // Send SMS notification
    try {
      await sendOrderConfirmationSms(`+${fullPhone}`, orderId);
      console.log(`[Orders] SMS sent to ${fullPhone} for order ${orderId}`);
    } catch (smsError) {
      console.error(`[Orders] Failed to send SMS to ${fullPhone}:`, smsError);
      // Don't fail the order if SMS fails - log and continue
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        totalAmount,
        message: 'Order created successfully. Check SMS for confirmation.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Orders] Request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Payment confirmation with SMS
 * Called after successful payment processing
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { orderId, phone, amount } = body;

    if (!orderId || !phone || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, phone, amount' },
        { status: 400 }
      );
    }

    const normalizedPhone = String(phone).replace(/\D/g, '');
    const fullPhone = normalizedPhone.length === 10 ? `91${normalizedPhone}` : normalizedPhone;

    // TODO: Update order status to PAID
    // await Order.findByIdAndUpdate(orderId, { status: 'PAID' });

    // Send payment confirmation SMS
    try {
      await sendPaymentSuccessSms(`+${fullPhone}`, orderId, String(amount));
      console.log(`[Orders] Payment SMS sent to ${fullPhone} for order ${orderId}`);
    } catch (smsError) {
      console.error(`[Orders] Failed to send payment SMS:`, smsError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment confirmed. Order is being processed.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Orders] Payment confirmation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Payment confirmation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
