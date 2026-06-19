# Popular Lab Tests Implementation - Technical Summary

## Overview

A complete admin management system for curating and displaying Popular Lab Tests on the home page. The system integrates lab tests from multiple sources (local database, Thyrocare, vendors) and allows admins to select which tests appear in a prominent home page section.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HOME PAGE                                │
│  (displays Popular Lab Tests in a featured section)              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ├─ GET /api/products?limit=500
                       └─ Filters by popularSections.includes('LabTests')
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐          ┌───▼────┐          ┌───▼────┐
    │ LabTest │          │ Product │          │ Partner│
    │  Model  │          │ Model   │          │Catalog │
    └─────────┘          └─────────┘          └────────┘
         │ popular=true       │ popular           │
         │                    │ Sections          │
         └────────────────────┼────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  ADMIN DASHBOARD  │
                    │   Lab Tests Mgr   │
                    └───────────────────┘
                          │
                    /admin/lab-tests
                    (Select & Save)
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐      ┌───▼────┐      ┌───▼────┐
    │PUT Route │      │GET Route│     │Display │
    │[id]      │      │(fetch)  │     │Component
    └──────────┘      └─────────┘     └────────┘
```

## Components & Files Created

### 1. Admin Management Page
**File:** `src/app/admin/lab-tests/page.tsx`

```tsx
// Features:
- Browse all lab tests from multiple sources
- Search by test name
- Filter by category
- Grid view (visual cards)
- Table view (detailed list)
- Bulk select/deselect
- Save changes to database
- Real-time status updates
```

**Key Features:**
- Multi-source support (LabTest, Product, Partner catalog)
- Category filtering (general, diabetic, cardiac, etc.)
- Search functionality
- Dual view modes (grid/table)
- Batch operations
- Live feedback

### 2. Lab Test Card Component
**File:** `src/components/PopularLabTestCard.tsx`

```tsx
// Displays individual lab test with:
- Test icon/image
- Test name and category
- Price and discount
- Rating and reviews
- Action buttons (Book Now / Add to Cart)
- Popular badge
- Responsive design
```

**Props:**
```tsx
interface PopularLabTestCardProps {
  test: LabTest;
  onBook?: () => void;
  onAddToCart?: () => void;
  isCompact?: boolean;
  showDiscount?: boolean;
}
```

### 3. API Endpoints

#### A. Get All Lab Tests (Admin)
```
GET /api/admin/lab-tests
```

**File:** `src/app/api/admin/lab-tests/route.ts`

**Query Parameters:**
```
- limit: number (default: 100)
- page: number (default: 1)
- search: string (search term)
- category: string (filter)
```

**Response:**
```json
{
  "data": [
    {
      "_id": "string",
      "testName": "string",
      "category": "string",
      "price": number,
      "popular": boolean,
      "isActive": boolean,
      ...
    }
  ],
  "total": number,
  "page": number,
  "totalPages": number
}
```

**Sources:**
- LabTest collection (local tests)
- Product collection (vendor products)
- Thyrocare partner catalog

#### B. Update Lab Test
```
PUT /api/admin/lab-tests/{testId}
```

**File:** `src/app/api/admin/lab-tests/[id]/route.ts`

**Request Body:**
```json
{
  "popular": boolean,
  "testName": "string",
  "price": number,
  "category": "string"
}
```

**Response:**
```json
{
  "labTest": { ...updated test }
}
```

#### C. Get Popular Lab Tests (Public)
```
GET /api/lab-tests/popular
```

**File:** `src/app/api/lab-tests/popular/route.ts`

**Query Parameters:**
```
- limit: number (default: 10)
- category: string (optional)
```

**Response:**
```json
{
  "data": [
    {
      "_id": "string",
      "testName": "string",
      "price": number,
      "rating": number,
      ...
    }
  ],
  "total": number,
  "source": "popular-lab-tests"
}
```

## Database Schema Updates

### LabTest Model (existing)
```typescript
{
  testId: String,
  testName: String,
  description: String,
  price: Number,
  homeCollectionAvailable: Boolean,
  centerCollectionAvailable: Boolean,
  reportTime: String,
  sampleType: String,
  fasting: Boolean,
  fastingHours: Number,
  category: String,
  rating: Number,
  reviews: Number,
  image: String,
  icon: String,
  mrp: Number,
  popular: Boolean,  // ← NEW FIELD
  testsIncluded: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model (existing)
```typescript
{
  _id: Number,
  name: String,
  price: Number,
  productType: String,
  category: String,
  
  // Popular sections support
  popularSections: [String],  // enum: ['Generic', 'Ayurveda', 'Homeopathy', 'LabTests']
  popularSection: String,      // legacy field
  
  ...other fields
}
```

## UI/UX Flow

### Admin Workflow

1. **Access Admin Panel**
   - Login to admin dashboard
   - Navigate to: Admin → Popular Lab Tests

2. **Browse Tests**
   - Search for specific tests
   - Filter by category
   - Switch between grid/table view

3. **Select Popular Tests**
   - Click checkboxes to select
   - Use "Select All" for bulk selection
   - Visual feedback on selections

4. **Save Changes**
   - Click "Save Changes" button
   - Confirmation message appears
   - Changes reflected on home page

### Home Page Display

```
┌────────────────────────────────────────────────────┐
│  Popular Lab Tests                                  │
│  Book health checkups and diagnostic tests online   │
├────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │ Test │  │ Test │  │ Test │  │ Test │           │
│  │  1   │  │  2   │  │  3   │  │  4   │           │
│  └──────┘  └──────┘  └──────┘  └──────┘           │
│  (cards display selected popular tests)            │
└────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Home Page (`src/app/page.tsx`)
```tsx
// Filters tests for Popular Lab Tests section
const labTests = allProducts.filter(
  (p) =>
    p.popularSections?.includes('LabTests') ||
    p.popularSection === 'LabTests' ||
    p.isPopularLabTests
);

// Display component
<PopularProductsDisplay
  title="Popular Lab Tests"
  productType="Lab Tests"
  products={labTests}
  onBuyNow={() => router.push('/lab-tests')}
/>
```

### 2. Admin Sidebar (`src/components/AdminSidebar.tsx`)
```tsx
{ label: 'Popular Lab Tests', href: '/admin/lab-tests', icon: Icons.medicines }
```

### 3. Lab Tests API (`src/app/api/lab-tests/route.ts`)
- Already fetches tests from multiple sources
- Combines local, vendor, and partner tests
- Supports filtering and pagination

## Data Flow Diagram

```
┌─────────────┐
│   Admin     │
│  Dashboard  │
└──────┬──────┘
       │
       │ 1. Fetches all lab tests
       ▼
┌─────────────────────────────────┐
│   /api/admin/lab-tests          │
│   (GET all tests)               │
└─────────┬───────────────────────┘
          │
          ├─ LabTest.find({isActive: true})
          ├─ Product.find({productType: 'Lab Tests'})
          └─ fetchPartnerCatalog()
          │
          ▼
┌─────────────────────────────────┐
│   Returns all tests with        │
│   popular: true/false           │
└─────────┬───────────────────────┘
          │
          │ 2. User selects tests
          │    and clicks Save
          │
          ▼
┌─────────────────────────────────┐
│   /api/admin/lab-tests/{id}     │
│   (PUT to update)               │
└─────────┬───────────────────────┘
          │
          ├─ LabTest.findByIdAndUpdate({popular: true})
          ├─ Product.findByIdAndUpdate({popularSections: [...]})
          └─ Update complete
          │
          ▼
┌─────────────────────────────────┐
│   Home Page loads and           │
│   displays Popular Lab Tests    │
└─────────────────────────────────┘
```

## Configuration Options

### Filter Options

```typescript
// Categories
CATEGORIES = [
  'general',       // General health checkups
  'diabetic',      // Diabetes screening
  'cardiac',       // Heart health
  'thyroid',       // Thyroid function
  'liver',         // Liver health
  'kidney',        // Kidney health
  'vitamin',       // Vitamin levels
  'infection',     // Infection screening
  'womens-health'  // Women's specific
];

// View Modes
VIEW_MODES = ['table', 'grid'];

// Max popular tests recommended: 4-12
// (displays nicely in responsive grid)
```

## Performance Considerations

### Caching Strategy
```
GET /api/lab-tests/popular
├─ Cache: 5 minutes
├─ Revalidate on admin update
└─ CDN compatible
```

### Database Indexes
```typescript
// Recommended indexes:
LabTest.index({ popular: 1, isActive: 1 })
LabTest.index({ category: 1 })
Product.index({ productType: 1, popularSections: 1 })
```

### Query Optimization
- Limit: 100 tests per fetch
- Pagination support
- Category filtering reduces results
- Search filtering reduces results

## Security Considerations

1. **Authentication**
   - Admin token required
   - JWT validation on all PUT/POST requests
   - Token expiration checks

2. **Authorization**
   - Admin role verification
   - Access control on update endpoints

3. **Data Validation**
   - Input sanitization
   - Type checking
   - Error handling

4. **Audit Logging**
   - Track admin changes
   - Log who updated what and when
   - Historical records

## Error Handling

### Common Errors

```
404 Not Found
├─ Test not found by ID
└─ Solution: Verify test ID exists

500 Server Error
├─ Database connection failed
├─ Invalid request body
└─ Solution: Check error message and logs

401 Unauthorized
├─ Missing admin token
└─ Solution: Re-login to admin panel

400 Bad Request
├─ Invalid category
├─ Invalid limit/page
└─ Solution: Check query parameters
```

## Testing Checklist

- [ ] Can select single test
- [ ] Can select multiple tests
- [ ] Can select all tests
- [ ] Can deselect tests
- [ ] Can search for tests
- [ ] Can filter by category
- [ ] Can switch view modes
- [ ] Can save changes
- [ ] Changes appear on home page
- [ ] Popular tests display correctly
- [ ] Discount calculations correct
- [ ] Images load properly
- [ ] Mobile responsive
- [ ] No console errors

## Future Enhancements

1. **Scheduled Changes**
   - Schedule popular tests to change on specific dates
   - Seasonal rotations

2. **A/B Testing**
   - Test different popular selections
   - Track click-through rates

3. **Analytics**
   - Track which popular tests get booked
   - Monitor conversion rates
   - Suggest better selections

4. **Auto-Selection**
   - AI-recommended popular tests
   - Based on booking history
   - Based on ratings

5. **Bulk Operations**
   - Import/Export popular tests
   - Copy from previous period
   - Template creation

## Quick Start

```bash
# 1. Access admin panel
/admin

# 2. Click "Popular Lab Tests" in sidebar
/admin/lab-tests

# 3. Search or filter tests
Search: "Thyroid"
Category: "thyroid"

# 4. Select popular tests
Click checkboxes

# 5. Save changes
Click "Save Changes" button

# 6. View on home page
/ (root home page)
```

## Related Features

- [Lab Test Booking System](./LAB_TEST_DETAILS_PAGE.md)
- [Thyrocare Integration](./THYROCARE_INTEGRATION.md)
- [Featured Products](./FEATURED_PRODUCTS_GUIDE.md)
- [Home Page Layout](./SYSTEM_ARCHITECTURE.md)

## Support & Maintenance

**Issue:** Tests not appearing
- Check if marked as popular
- Verify isActive: true
- Clear browser cache

**Issue:** Can't find test
- Use search function
- Check category filter
- Contact support

**Issue:** Changes not saving
- Check admin token
- Verify network connection
- Try again

---

**Last Updated:** June 2024
**Status:** Production Ready
**Maintained By:** Development Team
