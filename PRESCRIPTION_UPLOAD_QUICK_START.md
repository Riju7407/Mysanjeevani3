# Prescription Upload System - Quick Start Guide

## 📦 What Was Created

### New Files:
1. **API**: `src/app/api/prescriptions/upload/route.ts` - Handles file upload to Cloudinary
2. **Components**:
   - `src/components/PrescriptionUploadModal.tsx` - File upload dialog
   - `src/components/PrescriptionChecker.tsx` - Cart/checkout validation UI
   - `src/components/PrescriptionViewer.tsx` - Admin/vendor view prescriptions
3. **Utilities**: `src/lib/prescriptionUtils.ts` - Helper functions for prescription management
4. **Models**: Updated `src/lib/models/Order.ts` - Added prescription fields

### Updated Files:
- `src/lib/models/Order.ts` - Added `prescriptions[]` array and `requiresPrescription` flag to items

---

## 🚀 Quick Implementation (Copy-Paste Ready)

### 1. Add to Your Cart Page

**Location**: `src/app/cart/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import PrescriptionChecker from '@/components/PrescriptionChecker';
import { getMissingPrescriptions } from '@/lib/prescriptionUtils';

export default function CartPage() {
  const [prescriptionsReady, setPrescriptionsReady] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  
  // Fetch cart items
  useEffect(() => {
    // ... your existing cart fetch code
  }, []);

  const handleCheckout = () => {
    // Check if all Rx products have prescriptions
    const missing = getMissingPrescriptions(cartItems);
    if (missing.length > 0) {
      alert(
        `Please upload prescriptions for:\n${missing.map(m => `• ${m.productName}`).join('\n')}`
      );
      return;
    }

    // Proceed to checkout
    router.push('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {/* Existing cart items display */}
      {cartItems.length > 0 && (
        <div className="space-y-6">
          {/* Your existing cart items JSX */}

          {/* ADD THIS: Prescription Checker */}
          <PrescriptionChecker
            cartItems={cartItems}
            userId={userId}
            onPrescriptionsReady={setPrescriptionsReady}
          />

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={!prescriptionsReady}
            className={`w-full py-3 px-6 font-semibold rounded-lg transition ${
              prescriptionsReady
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {prescriptionsReady
              ? 'Proceed to Checkout'
              : 'Upload Prescriptions to Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### 2. Add to Your Checkout/Order Creation

**Location**: `src/app/checkout/page.tsx` or your payment form

```tsx
'use client';

import { getAllPrescriptions, getMissingPrescriptions } from '@/lib/prescriptionUtils';

export default function CheckoutPage() {
  const handlePlaceOrder = async () => {
    try {
      // 1. Validate all prescriptions uploaded
      const missing = getMissingPrescriptions(cartItems);
      if (missing.length > 0) {
        toast.error(`Please upload prescriptions for: ${missing.map(m => m.productName).join(', ')}`);
        return;
      }

      // 2. Get all prescription URLs from session storage
      const prescriptions = getAllPrescriptions();

      // 3. Build order data with prescriptions
      const orderData = {
        userId,
        items: cartItems.map(item => ({
          productId: item._id || item.productId,
          productName: item.name || item.productName,
          quantity: item.quantity,
          price: item.displayPrice || item.price,
          total: (item.displayPrice || item.price) * item.quantity,
          requiresPrescription: item.requiresPrescription || false,
          prescriptionUrl: prescriptions[item._id || item.productId] || null,
        })),
        // NEW: Add prescriptions array for storage
        prescriptions: cartItems
          .filter(item => item.requiresPrescription && prescriptions[item._id || item.productId])
          .map(item => ({
            productId: item._id || item.productId,
            productName: item.name || item.productName,
            prescriptionUrl: prescriptions[item._id || item.productId],
            uploadedAt: new Date().toISOString(),
          })),
        totalPrice,
        deliveryAddressId,
        currency: 'INR',
      };

      // 4. Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const order = await response.json();
      
      // 5. Process payment
      processPayment(order);

    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to place order');
    }
  };

  return (
    <div>
      {/* Your existing checkout form */}
      <button onClick={handlePlaceOrder}>Place Order</button>
    </div>
  );
}
```

### 3. Add to Your Admin Order Details Page

**Location**: `src/app/admin/orders/[id]/page.tsx`

```tsx
'use client';

import PrescriptionViewer from '@/components/PrescriptionViewer';

export default function AdminOrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Fetch order details
    fetchOrder(params.id);
  }, [params.id]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Existing order details */}

      {/* NEW: Prescription Viewer */}
      {order?.prescriptions && order.prescriptions.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">📋 Prescriptions</h2>
          <PrescriptionViewer
            prescriptions={order.prescriptions}
            orderId={order._id}
          />
        </div>
      )}
    </div>
  );
}
```

### 4. Add to Your Vendor Order View

**Location**: `src/app/vendor/orders/[id]/page.tsx`

```tsx
'use client';

import PrescriptionViewer from '@/components/PrescriptionViewer';

export default function VendorOrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchOrder(params.id);
    fetchVendorProducts();
  }, [params.id]);

  // Filter prescriptions for only this vendor's products
  const vendorPrescriptions = order?.prescriptions?.filter(p => 
    vendorProducts.some(vp => vp._id?.toString() === p.productId)
  ) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Existing vendor order details */}

      {/* NEW: Show only vendor's prescriptions */}
      {vendorPrescriptions.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-4">
            📋 Prescriptions for Your Products
          </h2>
          <PrescriptionViewer
            prescriptions={vendorPrescriptions}
            orderId={order._id}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 📝 Update Your Order API (if custom implementation)

If you have a custom order creation endpoint, ensure it saves prescriptions:

```tsx
// src/app/api/orders/route.ts

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    // ... existing validation code ...

    // Create order with prescriptions
    const order = await Order.create({
      userId: body.userId,
      items: body.items, // Now includes prescriptionUrl
      totalPrice: body.totalPrice,
      deliveryAddress: body.deliveryAddressId,
      prescriptions: body.prescriptions, // NEW: Store prescription metadata
      // ... other fields
    });

    return NextResponse.json(
      { orderId: order._id, message: 'Order created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
```

---

## 🧪 Testing Checklist

- [ ] Add product with `requiresPrescription: true` to cart
- [ ] PrescriptionChecker appears in cart
- [ ] Can upload JPG/PNG/PDF file
- [ ] File validation works (rejects >5MB, wrong type)
- [ ] Upload progress shows
- [ ] Prescription URL saved
- [ ] Checkout button enabled
- [ ] Order created with prescription URLs
- [ ] Admin can view prescription
- [ ] Can download prescription
- [ ] Vendor sees only their product's prescriptions

---

## 🔄 User Flow Diagram

```
User adds Rx product to cart
         ↓
Cart page shows "Prescription Required"
         ↓
User clicks "Upload Prescription"
         ↓
Modal opens with file upload
         ↓
User selects JPG/PNG/PDF (max 5MB)
         ↓
File uploaded to Cloudinary
         ↓
URL stored in sessionStorage
         ↓
PrescriptionChecker marked complete ✓
         ↓
Checkout button enabled
         ↓
User proceeds to payment
         ↓
Order created with prescription URLs
         ↓
Admin/vendor can view in order details
```

---

## 🛠️ Troubleshooting

### Issue: "Cloudinary credentials not configured"
- **Solution**: Ensure `.env.local` has:
  ```
  CLOUDINARY_CLOUD_NAME=...
  CLOUDINARY_API_KEY=...
  CLOUDINARY_API_SECRET=...
  ```

### Issue: File upload fails silently
- **Solution**: Check browser console for errors. Ensure file meets criteria:
  - Type: JPG, JPEG, PNG, PDF only
  - Size: < 5MB
  - Network: Connected

### Issue: Prescription not showing in order
- **Solution**: Ensure `prescriptions` array is saved in Order model when creating order

### Issue: Vendor can see other vendors' prescriptions
- **Solution**: Filter prescriptions in vendor view by vendor's product IDs

---

## 📞 Support

For issues or questions, refer to:
- Full documentation: `PRESCRIPTION_UPLOAD_SYSTEM.md`
- API reference: Check `/api/prescriptions/upload` route comments
- Component props: Check each component's interface definition
