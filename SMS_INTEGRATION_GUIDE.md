# SMS Integration Guide - My Sanjeevni Portal

## Overview

The SMS service provides comprehensive, DLT-compliant SMS notifications for My Sanjeevni Portal using **Pandeyra SMS API**. It includes pre-built templates for all common business flows: authentication, orders, lab tests, doctor consultations, and more.

---

## Configuration

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# Pandeyra SMS Configuration
PANDEYRA_SMS_USERNAME=MYSANJV
PANDEYRA_SMS_API_KEY=3938e5b8bdXX
PANDEYRA_SMS_SENDER_ID=MSNJVI
SMS_TEST_MODE=false              # Set to "true" for development (SMS not sent)
```

**Important:** Keep your API key safe. Never commit it to version control. Use `.env.local` for local development and configure proper secrets management in production (AWS Secrets Manager, Azure Key Vault, etc.).

---

## SMS Templates

### Available Templates

| Template ID                   | Name                 | Variables                    | Use Case                           |
| ----------------------------- | -------------------- | ---------------------------- | ---------------------------------- |
| `LOGIN_OTP`                   | Login OTP            | OTP Code                     | User login authentication          |
| `REGISTRATION_OTP`            | Registration OTP     | OTP Code                     | New user registration              |
| `PASSWORD_RESET_OTP`          | Password Reset OTP   | OTP Code                     | Password reset flow                |
| `ORDER_CONFIRMATION`          | Order Confirmation   | Order ID                     | Order booking confirmation         |
| `LAB_TEST_BOOKING`            | Lab Test Booking     | Booking ID, Date & Time      | Lab test booking confirmation      |
| `DOCTOR_CONSULTATION_BOOKING` | Doctor Consultation  | Consultation ID, Date & Time | Doctor consultation booking        |
| `PRESCRIPTION_READY`          | Prescription Ready   | Prescription ID              | Prescription download notification |
| `PAYMENT_SUCCESS`             | Payment Success      | Order ID, Amount             | Payment confirmation               |
| `ORDER_SHIPPED`               | Order Shipped        | Order ID, Tracking ID        | Shipment notification              |
| `ORDER_DELIVERED`             | Order Delivered      | Order ID                     | Delivery confirmation              |
| `APPOINTMENT_REMINDER`        | Appointment Reminder | Date, Time                   | Pre-appointment reminder           |
| `REFUND_INITIATED`            | Refund Initiated     | Order ID, Amount             | Refund notification                |

---

## API Usage

### Using SMS Templates (Recommended)

The SMS service includes helper functions for each common scenario:

#### 1. Authentication OTPs

```typescript
import { sendOtpViaSms } from "@/lib/smsService";

// For login
await sendOtpViaSms("+919876543210", "123456", "login");

// For registration
await sendOtpViaSms("+919876543210", "123456", "signup");

// For password reset
await sendOtpViaSms("+919876543210", "123456", "reset");
```

#### 2. Order Confirmation

```typescript
import { sendOrderConfirmationSms } from "@/lib/smsService";

await sendOrderConfirmationSms("+919876543210", "ORD-123456");
```

**SMS sent:** "Thank you for your order, Order ID: ORD-123456 Track your order anytime at https://mysanjeevni.com/ and We will notify you once it is shipped."

#### 3. Lab Test Booking

```typescript
import { sendLabTestBookingSms } from "@/lib/smsService";

await sendLabTestBookingSms(
  "+919876543210",
  "LAB-123456",
  "2024-06-20 10:30 AM",
);
```

**SMS sent:** "Your lab test booking is confirmed, Booking ID: LAB-123456 Date & Time: 2024-06-20 10:30 AM For details, visit https://mysanjeevni.com/"

#### 4. Doctor Consultation Booking

```typescript
import { sendDoctorConsultationBookingSms } from "@/lib/smsService";

await sendDoctorConsultationBookingSms(
  "+919876543210",
  "CONS-123456",
  "2024-06-25 02:00 PM",
);
```

**SMS sent:** "Your doctor consultation is scheduled, Consultation ID: CONS-123456 Date & Time: 2024-06-25 02:00 PM Join via https://mysanjeevni.com/"

#### 5. Order Shipped

```typescript
import { sendOrderShippedSms } from "@/lib/smsService";

await sendOrderShippedSms("+919876543210", "ORD-123456", "TRK-987654");
```

#### 6. Order Delivered

```typescript
import { sendOrderDeliveredSms } from "@/lib/smsService";

await sendOrderDeliveredSms("+919876543210", "ORD-123456");
```

#### 7. Appointment Reminder

```typescript
import { sendAppointmentReminderSms } from "@/lib/smsService";

await sendAppointmentReminderSms("+919876543210", "2024-06-25", "02:00 PM");
```

#### 8. Prescription Ready

```typescript
import { sendPrescriptionReadySms } from "@/lib/smsService";

await sendPrescriptionReadySms("+919876543210", "PRESC-123456");
```

#### 9. Payment Success

```typescript
import { sendPaymentSuccessSms } from "@/lib/smsService";

await sendPaymentSuccessSms("+919876543210", "ORD-123456", "2499");
```

#### 10. Refund Initiated

```typescript
import { sendRefundInitiatedSms } from "@/lib/smsService";

await sendRefundInitiatedSms("+919876543210", "ORD-123456", "2499");
```

### Using Custom Templates

For advanced use cases, build SMS from templates manually:

```typescript
import { sendSmsWithTemplate } from "@/lib/smsService";

await sendSmsWithTemplate({
  phone: "+919876543210",
  templateId: "ORDER_CONFIRMATION",
  variables: ["ORD-123456"],
});
```

### Sending Raw Messages

For maximum flexibility:

```typescript
import { sendSms } from "@/lib/smsService";

await sendSms("+919876543210", "Your custom message here");
```

---

## Integration Examples

### Order API Endpoint

```typescript
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmationSms } from "@/lib/smsService";

export async function POST(request: NextRequest) {
  try {
    const { phone, orderId, items } = await request.json();

    // Create order in database...
    // const order = await Order.create({ ...});

    // Send SMS notification
    try {
      await sendOrderConfirmationSms(phone, orderId);
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);
      // Don't fail the order if SMS fails
    }

    return NextResponse.json({ success: true, orderId }, { status: 201 });
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
```

### Lab Test Booking Endpoint

```typescript
// src/app/api/lab-tests/book/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendLabTestBookingSms } from "@/lib/smsService";

export async function POST(request: NextRequest) {
  try {
    const { phone, bookingId, dateTime, testType } = await request.json();

    // Create booking...
    // const booking = await LabTestBooking.create({ ... });

    // Send confirmation SMS
    try {
      await sendLabTestBookingSms(phone, bookingId, dateTime);
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);
    }

    return NextResponse.json({ success: true, bookingId }, { status: 201 });
  } catch (error) {
    console.error("Booking failed:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
```

### Doctor Consultation Endpoint

```typescript
// src/app/api/doctor-consultation/book/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendDoctorConsultationBookingSms } from "@/lib/smsService";

export async function POST(request: NextRequest) {
  try {
    const { phone, consultationId, dateTime, doctorName } =
      await request.json();

    // Create consultation...
    // const consultation = await DoctorConsultation.create({ ... });

    // Send confirmation SMS
    try {
      await sendDoctorConsultationBookingSms(phone, consultationId, dateTime);
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);
    }

    return NextResponse.json(
      { success: true, consultationId },
      { status: 201 },
    );
  } catch (error) {
    console.error("Consultation booking failed:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
```

---

## Testing

### Test Mode

For development, enable test mode to skip actual SMS sending:

```env
SMS_TEST_MODE=true
```

In test mode:

- SMS messages are logged to console instead of sent
- No charges applied to your Pandeyra account
- Useful for development and testing workflows

### Manual Testing

```typescript
// test-sms.ts
import {
  sendOtpViaSms,
  sendOrderConfirmationSms,
  sendLabTestBookingSms,
  sendDoctorConsultationBookingSms,
} from "@/lib/smsService";

async function testSms() {
  try {
    console.log("Testing Login OTP...");
    await sendOtpViaSms("+919876543210", "123456", "login");

    console.log("Testing Order Confirmation...");
    await sendOrderConfirmationSms("+919876543210", "ORD-123456");

    console.log("Testing Lab Test Booking...");
    await sendLabTestBookingSms(
      "+919876543210",
      "LAB-123456",
      "2024-06-20 10:30 AM",
    );

    console.log("Testing Doctor Consultation...");
    await sendDoctorConsultationBookingSms(
      "+919876543210",
      "CONS-123456",
      "2024-06-25 02:00 PM",
    );

    console.log("All tests passed!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testSms();
```

---

## Troubleshooting

### SMS Not Sent?

1. **Check environment variables:**

   ```bash
   echo $PANDEYRA_SMS_USERNAME
   echo $PANDEYRA_SMS_API_KEY
   ```

2. **Verify test mode:**

   ```env
   SMS_TEST_MODE=false  # Should be false for production
   ```

3. **Check phone format:**
   - Must be 10-15 digits
   - Invalid: "9876543210" (missing country code)
   - Valid: "+919876543210" or "919876543210"

4. **Check logs:**
   ```bash
   # Look for [Pandeyra SMS] logs
   tail -f .next/server/logs/...
   ```

### Common Errors

| Error                                     | Solution                                                               |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| "Pandeyra SMS credentials not configured" | Add `PANDEYRA_SMS_USERNAME` and `PANDEYRA_SMS_API_KEY` to `.env.local` |
| "Invalid phone number"                    | Ensure phone is 10-15 digits                                           |
| "Invalid template"                        | Use valid template ID from the Templates table                         |
| "Too many variables"                      | Don't exceed `maxVariables` for the template                           |
| "API returned failure"                    | Check Pandeyra account balance and sender ID                           |

---

## Best Practices

1. **Always validate phone numbers** before sending SMS
2. **Catch errors gracefully** - SMS failure shouldn't block main operations
3. **Log SMS sends** for audit trails and debugging
4. **Use SMS_TEST_MODE** in development to avoid charges
5. **Rate limit SMS** - prevent abuse by limiting requests per user/phone
6. **Keep credentials secure** - never hardcode API keys
7. **Monitor SMS delivery** - track sent/failed messages
8. **Handle long messages** - SMS has length limits (160 chars for single SMS, 306+ for concatenated)

---

## SMS Templates Reference

### Template Variables Format

- Use `{#var#}` as placeholder in templates
- Each template defines `maxVariables` limit
- Variables are replaced in order

**Example:**

```typescript
// Template: "Hello {#var#}, your code is {#var#}"
// Variables: ["John", "123456"]
// Result: "Hello John, your code is 123456"
```

---

## Support

For issues or questions:

1. Check `.env.local` configuration
2. Review Pandeyra SMS portal logs: https://sms.pandeyra.com/
3. Verify sender ID (MSNJVI) is registered
4. Check account balance on Pandeyra portal
5. Review application logs for SMS error details

---

## Related Files

- [`src/lib/smsService.ts`](src/lib/smsService.ts) - Main SMS service
- [`src/lib/smsTemplates.ts`](src/lib/smsTemplates.ts) - SMS template definitions
- [`src/lib/fast2sms.ts`](src/lib/fast2sms.ts) - Legacy compatibility layer
