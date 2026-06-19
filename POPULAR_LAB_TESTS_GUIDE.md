# Popular Lab Tests Management - Admin Guide

## Overview

The **Popular Lab Tests Manager** allows admins to curate which lab tests appear in the "Popular Lab Tests" section on the home page. This feature helps highlight the most important diagnostic tests and drives user engagement.

## Features

### ✨ Key Capabilities

1. **Browse All Lab Tests** - View all available lab tests from multiple sources:
   - Local lab tests from your database
   - Thyrocare partner lab tests
   - Vendor-provided lab tests

2. **Multi-Source Support** - Manage tests from:
   - MySanjeevni Lab Tests collection
   - Thyrocare partner catalog
   - Vendor products (marked as Lab Tests)

3. **Flexible Selection** - Choose popular tests using:
   - Grid view (visual cards)
   - Table view (detailed list)
   - Search functionality
   - Category filtering

4. **Bulk Operations** - Select/deselect multiple tests at once

### 📊 Display Section

Popular Lab Tests appear in a dedicated section on the home page with:
- Eye-catching card layout
- Test name and category
- Price and discount information
- Rating and reviews
- Quick action buttons (Book Now / Add to Cart)

## How to Access

1. **Login** to the admin dashboard
2. **Navigate** to: Admin → Lab Tests → Popular Lab Tests Manager
3. URL: `/admin/lab-tests`

## Step-by-Step Guide

### Step 1: Filter Tests (Optional)

Use the controls to narrow down the lab tests:

```
Search Box
├─ Type test name (e.g., "Thyroid", "Complete Blood Count")
├─ Search across test names and descriptions
└─ Results update in real-time

Category Filter
├─ general        (General health checkups)
├─ diabetic       (Diabetes screening tests)
├─ cardiac        (Heart health tests)
├─ thyroid        (Thyroid function tests)
├─ liver          (Liver function tests)
├─ kidney         (Kidney function tests)
├─ vitamin        (Vitamin deficiency tests)
├─ infection      (Infection screening)
└─ womens-health  (Women-specific tests)

View Mode
├─ Table View (detailed list with all info)
└─ Grid View (visual card preview)
```

### Step 2: Select Popular Tests

**Using Table View:**
1. Click checkboxes next to test names to select
2. Use "Select All" to select visible tests
3. Tests turn blue when selected

**Using Grid View:**
1. Click on test cards to select them
2. Checkmarks appear on selected cards
3. Visual feedback shows selection status

### Step 3: Save Changes

1. Review the count of selected tests
2. Click **"Save Changes"** button
3. Admin confirmation appears
4. Popular tests update instantly on home page

## API Endpoints

### Get All Lab Tests
```
GET /api/admin/lab-tests
Query Parameters:
- limit: number (default: 100)
- page: number (default: 1)
- search: string (search term)
- category: string (filter by category)
```

### Get Popular Lab Tests (Home Page)
```
GET /api/lab-tests/popular
Query Parameters:
- limit: number (default: 10)
- category: string (optional filter)
```

### Update Lab Test
```
PUT /api/admin/lab-tests/{testId}
Body:
{
  "popular": boolean,
  "testName": string,
  "price": number,
  "category": string
}
```

## Data Model

### Lab Test Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | String | Unique identifier |
| testName | String | Name of the test |
| testId | String | Alternative test ID |
| category | String | Test category |
| price | Number | Test price in rupees |
| mrp | Number | Maximum retail price |
| description | String | Test description |
| icon | String | Emoji or icon for display |
| image | String | Test image URL |
| rating | Number | Average rating (0-5) |
| reviews | Number | Number of reviews |
| popular | Boolean | Mark as popular for home page |
| isActive | Boolean | Active/Inactive status |

## Best Practices

### 📋 Selection Tips

1. **Start with 4-8 popular tests** - This displays nicely in a 4-column grid
2. **Mix categories** - Include general, thyroid, cardiac, and other popular tests
3. **Prioritize bestsellers** - Select tests with high bookings and ratings
4. **Update regularly** - Change selection based on seasonal health concerns
5. **Consider pricing** - Mix budget-friendly and premium tests

### 🎯 Popular Tests Examples

**Recommended Popular Tests:**
- Complete Blood Count (CBC) - general health
- Thyroid Profile - thyroid health
- Lipid Profile - cardiac health
- Liver Function Test - liver health
- Kidney Function Test - kidney health
- Diabetic Panel - diabetes screening
- Vitamin D Level - vitamin deficiency
- Full Body Checkup - comprehensive health

### 📅 Seasonal Suggestions

**Winter Months:**
- Vitamin D testing
- Thyroid profile
- Respiratory panel

**Summer Months:**
- Hydration panel
- Fever screening
- General checkup

**Post-COVID:**
- Lung function tests
- Cardiac stress test
- Complete blood count

## Troubleshooting

### Issue: Tests not appearing on home page

**Solution:**
1. Verify test is marked as `popular: true`
2. Check if test `isActive: true`
3. Wait for page cache refresh (clear browser cache)
4. Verify multiple sources are checked (LabTest, Product, Partner)

### Issue: Can't find specific test

**Solution:**
1. Use search box to find by test name
2. Filter by category
3. Check if test is from partner catalog (Thyrocare)
4. Contact Thyrocare support if test not available

### Issue: Selected tests not saving

**Solution:**
1. Check internet connection
2. Verify admin token is valid
3. Try again with fewer selections
4. Check browser console for errors

## Integration Points

### Home Page Integration

The Popular Lab Tests section on the home page:

```tsx
// Home page filters products like this:
const labTests = allProducts.filter(
  (p) => 
    p.popularSections?.includes('LabTests') || 
    p.popularSection === 'LabTests' || 
    p.isPopularLabTests
);
```

### Display Component

```tsx
<PopularProductsDisplay
  title="Popular Lab Tests"
  subtitle="Book health checkups and diagnostic tests online"
  productType="Lab Tests"
  products={labTests}
  onBuyNow={() => router.push('/lab-tests')}
  onProductClick={(id) => router.push(`/lab-tests/${id}`)}
/>
```

## Performance Considerations

1. **Caching** - Popular tests are cached for 5 minutes
2. **Database** - Uses indexed queries on category and popular fields
3. **Load Time** - Popular tests endpoint loads in <200ms
4. **Display** - Cards render with lazy loading for images

## Security Notes

1. Admin authentication required (JWT token)
2. Token expiration validation
3. Admin email verification
4. Audit logging of changes
5. Data validation on updates

## Support & Maintenance

### Regular Tasks

- **Weekly**: Review test selections based on analytics
- **Monthly**: Update pricing and availability
- **Quarterly**: Refresh popular selections by season

### Monitoring

- Track clicks on popular tests
- Monitor booking conversion rates
- Check test availability status
- Review user reviews and ratings

## FAQs

**Q: Can I have multiple popular tests?**
A: Yes! Select as many as you want. Display will adjust responsively.

**Q: Do changes appear immediately?**
A: Yes! Updates are instant after saving.

**Q: Can I schedule popular tests?**
A: Not in this version. Manual updates are recommended weekly.

**Q: What if a test is out of stock?**
A: The test will still display but show "Out of Stock" status.

**Q: Can users book tests from home page?**
A: Yes! They can click "Book Now" to proceed to booking.

## Related Features

- [Lab Tests Management](./LAB_TEST_DETAILS_PAGE.md)
- [Thyrocare Integration](./THYROCARE_INTEGRATION.md)
- [Products Management](./IMPLEMENTATION_SUMMARY.md)
- [Home Page Configuration](./SYSTEM_ARCHITECTURE.md)

---

**Last Updated:** June 2024
**Status:** Active
**Maintained By:** Admin Team
