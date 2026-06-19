# Prescription Upload System for Rx Products

## 📋 Overview

This system allows users to upload prescriptions for products that require Rx (prescription) before purchase. Prescriptions are stored on Cloudinary and accessible only to the user, admin, and vendors.

## 🎯 Features

✅ Upload prescriptions during checkout (JPG, JPEG, PNG, PDF)  
✅ Cloudinary integration for secure storage  
✅ File size validation (max 5MB)  
✅ Progress tracking during upload  
✅ Admin/vendor can view and download prescriptions  
✅ Session storage for prescription URLs during checkout  
✅ Prescription metadata stored in Order collection  
✅ Privacy - only user, admin, and vendor can access  

## 📁 Files Created

### 1. **Order Model Update**
- **File**: `src/lib/models/Order.ts`
- **Added Fields**:
  - `items[].requiresPrescription` - Boolean flag
  - `items[].prescriptionUrl` - Cloudinary URL for item-specific prescription
  - `prescriptions[]` - Array of all prescriptions in order with metadata

### 2. **Prescription Upload API**
- **File**: `src/app/api/prescriptions/upload/route.ts`
- **Method**: POST
- **Accepts**:
  - `file` (FormData) - JPG, JPEG, PNG, or PDF (max 5MB)
  - `productId` (string)
  - `productName` (string)
  - `userId` (string)
- **Returns**:
  ```json
  {
    "success": true,
    "prescriptionUrl": "https://res.cloudinary.com/...",
    "publicId": "prescriptions/user-id/...",
    "productId": "...",
    "productName": "..."
  }
  ```

### 3. **Prescription Upload Modal Component**
- **File**: `src/components/PrescriptionUploadModal.tsx`
- **Props**:
  - `isOpen` - Boolean
  - `productId` - String
  - `productName` - String
  - `userId` - String
  - `onClose` - Callback
  - `onSuccess` - Callback with prescriptionUrl
  - `onError` - Callback with error message
- **Features**:
  - File selection with drag & drop
  - Image preview
  - Upload progress bar
  - File validation

### 4. **Prescription Checker Component**
- **File**: `src/components/PrescriptionChecker.tsx`
- **Purpose**: Show status of Rx products and manage uploads
- **Props**:
  - `cartItems` - Array of cart items
  - `userId` - String
  - `onPrescriptionsReady` - Callback when all prescriptions uploaded
- **Features**:
  - Shows all Rx products in cart
  - Upload/Replace/Remove buttons
  - Status indicators
  - Info about prescription requirements

### 5. **Prescription Viewer Component**
- **File**: `src/components/PrescriptionViewer.tsx`
- **Purpose**: Admin/vendor view prescriptions
- **Props**:
  - `prescriptions` - Array of prescription objects
  - `orderId` - Order ID for reference
- **Features**:
  - List all prescriptions for order
  - View full-screen preview
  - Download functionality
  - PDF and image support

### 6. **Prescription Utilities**
- **File**: `src/lib/prescriptionUtils.ts`
- **Functions**:
  - `storePrescriptionData()` - Save to sessionStorage
  - `getPrescriptionData()` - Retrieve single prescription
  - `getAllPrescriptions()` - Get all uploaded prescriptions
  - `clearPrescriptionData()` - Remove prescription
  - `allPrescriptionsUploaded()` - Check if all Rx products have prescriptions
  - `getMissingPrescriptions()` - Get list of products without prescriptions

## 🔄 Integration Steps

### Step 1: Update Cart Page
Add PrescriptionChecker to your cart page:

```tsx
'use client';

import PrescriptionChecker from '@/components/PrescriptionChecker';
import { useState } from 'react';

export default function CartPage() {
  const [prescriptionsReady, setPrescriptionsReady] = useState(true);
  
  return (
    <div>
      {/* Existing cart content */}
      
      {/* Add Prescription Checker */}
      {cartItems.length > 0 && (
        <PrescriptionChecker
          cartItems={cartItems}
          userId={userId}
          onPrescriptionsReady={setPrescriptionsReady}
        />
      )}
      
      {/* Checkout button - disabled until prescriptions ready */}
      <button
        disabled={!prescriptionsReady}
        onClick={handleCheckout}
        className="..."
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
```

### Step 2: Update Checkout Page
Ensure checkout validates prescriptions:

```tsx
import { allPrescriptionsUploaded, getMissingPrescriptions } from '@/lib/prescriptionUtils';

export default function CheckoutPage() {
  const handlePlaceOrder = async () => {
    // Check prescriptions
    const missing = getMissingPrescriptions(cartItems);
    if (missing.length > 0) {
      alert(`Please upload prescriptions for: ${missing.map(m => m.productName).join(', ')}`);
      return;
    }
    
    // Get prescriptions
    const prescriptions = getAllPrescriptions();
    
    // Include in order payload
    const orderData = {
      items: cartItems.map(item => ({
        ...item,
        prescriptionUrl: prescriptions[item.productId],
      })),
      prescriptions: cartItems
        .filter(item => item.requiresPrescription && prescriptions[item.productId])
        .map(item => ({
          productId: item.productId,
          productName: item.productName,
          prescriptionUrl: prescriptions[item.productId],
          uploadedAt: new Date(),
        })),
      // ... other order fields
    };
    
    // Save order
    await saveOrder(orderData);
  };
}
```

### Step 3: Update Order API
Ensure the POST /api/orders endpoint saves prescriptions:

```tsx
export async function POST(request: NextRequest) {
  // ... existing code
  
  const order = await Order.create({
    userId,
    items: body.items, // Now includes prescriptionUrl
    prescriptions: body.prescriptions, // New field
    // ... other fields
  });
  
  // ... rest of code
}
```

### Step 4: Update Admin Order Details
Show prescriptions for admin:

```tsx
import PrescriptionViewer from '@/components/PrescriptionViewer';

export default function OrderDetailsPage({ order }) {
  return (
    <div>
      {/* Existing order details */}
      
      {/* Add Prescription Viewer */}
      {order.prescriptions && order.prescriptions.length > 0 && (
        <PrescriptionViewer
          prescriptions={order.prescriptions}
          orderId={order._id}
        />
      )}
    </div>
  );
}
```

### Step 5: Update Vendor Order Details
Vendors can also view prescriptions:

```tsx
import PrescriptionViewer from '@/components/PrescriptionViewer';

export default function VendorOrderPage({ order }) {
  // Filter prescriptions for vendor's products only
  const vendorProductIds = vendorProducts.map(p => p._id);
  const vendorPrescriptions = order.prescriptions?.filter(
    p => vendorProductIds.includes(p.productId)
  );
  
  return (
    <div>
      {/* Existing vendor order view */}
      
      {vendorPrescriptions && vendorPrescriptions.length > 0 && (
        <PrescriptionViewer
          prescriptions={vendorPrescriptions}
          orderId={order._id}
        />
      )}
    </div>
  );
}
```

## 🧪 Testing Checklist

- [ ] Product with `requiresPrescription: true` shows in cart
- [ ] PrescriptionChecker component displays for Rx products
- [ ] User can upload JPG, JPEG, PNG, PDF files
- [ ] File size validation works (reject >5MB)
- [ ] File type validation works
- [ ] Upload progress bar shows during upload
- [ ] Prescription URL is stored in sessionStorage
- [ ] Checkout button disabled until all prescriptions uploaded
- [ ] Order is created with prescription URLs in items and prescriptions array
- [ ] Admin can view prescriptions in order details
- [ ] Vendor can view prescriptions for their products
- [ ] Can view full-screen prescription preview
- [ ] Can download prescription file
- [ ] PDF prescriptions display correctly
- [ ] Image prescriptions display correctly

## 🔒 Security & Privacy

✅ **Access Control**: Only user, admin, and vendor can access prescriptions  
✅ **Cloudinary Folder**: Stored in `prescriptions/{userId}` folder  
✅ **HTTPS Only**: All Cloudinary URLs use HTTPS  
✅ **File Validation**: Only accepted file types allowed  
✅ **Size Limit**: Max 5MB per file  

## 📱 User Flow

1. User adds Rx product to cart
2. Cart page shows "Prescription Required" section
3. User clicks "Upload Prescription" button
4. Modal opens for file selection
5. User selects JPG/PNG/PDF file (max 5MB)
6. Upload progress shown
7. File uploaded to Cloudinary
8. URL stored in sessionStorage
9. Prescription marked as "Complete"
10. Checkout button enabled
11. User proceeds to payment
12. Order created with prescription data
13. Admin/vendor can view prescription in order details

## 🎨 UI Components Summary

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `PrescriptionUploadModal` | File upload interface | isOpen, productId, userId, onSuccess, onError |
| `PrescriptionChecker` | Rx product management in cart | cartItems, userId, onPrescriptionsReady |
| `PrescriptionViewer` | Admin/vendor view prescriptions | prescriptions, orderId |

## 📊 Data Storage

### Order Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  items: [
    {
      productId: String,
      productName: String,
      quantity: Number,
      price: Number,
      requiresPrescription: Boolean,
      prescriptionUrl: String, // Cloudinary URL
    }
  ],
  prescriptions: [
    {
      productId: String,
      productName: String,
      prescriptionUrl: String, // Cloudinary URL
      uploadedAt: Date,
    }
  ],
  // ... other fields
}
```

## 🚀 Future Enhancements

- [ ] Automatic expiry of old prescriptions
- [ ] Prescription validity checks (e.g., issued date vs current date)
- [ ] Multiple prescriptions per product
- [ ] Prescription history tracking
- [ ] AI verification of prescription images
- [ ] Doctor email notification when Rx used
- [ ] Prescription refund automation
