# SMS Integration Quick Start - My Sanjeevni Portal

## 🚀 5-Minute Setup

### Step 1: Environment Configuration

Add to your `.env.local`:

```env
# Pandeyra SMS Configuration
PANDEYRA_SMS_USERNAME=MYSANJV
PANDEYRA_SMS_API_KEY=3938e5b8bdXX
PANDEYRA_SMS_SENDER_ID=MSNJVI
SMS_TEST_MODE=false
```

### Step 2: Import and Use

Choose your use case:

#### Login/Registration OTP

```typescript
import { sendOtpViaSms } from "@/lib/smsService";

// In your login endpoint
await sendOtpViaSms("+919876543210", "123456", "login");

// In your signup endpoint
await sendOtpViaSms("+919876543210", "123456", "signup");
```

#### Order Booking

```typescript
import { sendOrderConfirmationSms } from "@/lib/smsService";

await sendOrderConfirmationSms("+919876543210", "ORD-20240620-ABC12");
```

**SMS:** "Thank you for your order, Order ID: ORD-20240620-ABC12 Track your order anytime at https://mysanjeevni.com/ and We will notify you once it is shipped."

#### Lab Test Booking

```typescript
import { sendLabTestBookingSms } from "@/lib/smsService";

await sendLabTestBookingSms(
  "+919876543210",
  "LAB-20240620-ABC12",
  "2024-06-20 10:30 AM",
);
```

**SMS:** "Your lab test booking is confirmed, Booking ID: LAB-20240620-ABC12 Date & Time: 2024-06-20 10:30 AM For details, visit https://mysanjeevni.com/"

#### Doctor Consultation Booking

```typescript
import { sendDoctorConsultationBookingSms } from "@/lib/smsService";

await sendDoctorConsultationBookingSms(
  "+919876543210",
  "CONS-20240620-ABC12",
  "2024-06-25 02:00 PM",
);
```

**SMS:** "Your doctor consultation is scheduled, Consultation ID: CONS-20240620-ABC12 Date & Time: 2024-06-25 02:00 PM Join via https://mysanjeevni.com/"

---

## 📋 All Available SMS Templates

| Template                        | Function                                                | SMS Sent                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| **LOGIN_OTP**                   | `sendOtpViaSms(phone, otp, 'login')`                    | "OTP {code} is required to log in..."         |
| **REGISTRATION_OTP**            | `sendOtpViaSms(phone, otp, 'signup')`                   | "OTP {code} is required to verify..."         |
| **PASSWORD_RESET_OTP**          | `sendOtpViaSms(phone, otp, 'reset')`                    | "OTP {code} is required to reset..."          |
| **ORDER_CONFIRMATION**          | `sendOrderConfirmationSms(phone, orderId)`              | "Thank you for your order, Order ID: {id}..." |
| **LAB_TEST_BOOKING**            | `sendLabTestBookingSms(phone, id, dateTime)`            | "Your lab test booking is confirmed..."       |
| **DOCTOR_CONSULTATION_BOOKING** | `sendDoctorConsultationBookingSms(phone, id, dateTime)` | "Your doctor consultation is scheduled..."    |
| **PRESCRIPTION_READY**          | `sendPrescriptionReadySms(phone, id)`                   | "Your prescription is ready..."               |
| **PAYMENT_SUCCESS**             | `sendPaymentSuccessSms(phone, orderId, amount)`         | "Payment successful for Order ID..."          |
| **ORDER_SHIPPED**               | `sendOrderShippedSms(phone, orderId, trackingId)`       | "Your order has been shipped..."              |
| **ORDER_DELIVERED**             | `sendOrderDeliveredSms(phone, orderId)`                 | "Your order has been delivered..."            |
| **APPOINTMENT_REMINDER**        | `sendAppointmentReminderSms(phone, date, time)`         | "Reminder: Your appointment is..."            |
| **REFUND_INITIATED**            | `sendRefundInitiatedSms(phone, orderId, amount)`        | "Refund for Order ID has been initiated..."   |

---

## 🧪 Testing in Development

### Enable Test Mode

```env
SMS_TEST_MODE=true
```

When enabled, SMS messages are logged instead of sent:

```
[SMS_TEST_MODE] Skipping Pandeyra SMS for +919876543210
[SMS_TEST_MODE] Template: LOGIN_OTP
[SMS_TEST_MODE] Message: OTP 123456 is required...
```

### Test All Templates

```typescript
// test-sms-templates.ts
import {
  sendOtpViaSms,
  sendOrderConfirmationSms,
  sendLabTestBookingSms,
  sendDoctorConsultationBookingSms,
  sendPaymentSuccessSms,
  sendOrderShippedSms,
  sendOrderDeliveredSms,
} from "@/lib/smsService";

async function testAllSms() {
  const phone = "+919876543210";

  try {
    console.log("Testing Login OTP...");
    await sendOtpViaSms(phone, "123456", "login");

    console.log("Testing Signup OTP...");
    await sendOtpViaSms(phone, "123456", "signup");

    console.log("Testing Order Confirmation...");
    await sendOrderConfirmationSms(phone, "ORD-20240620-ABC12");

    console.log("Testing Lab Test Booking...");
    await sendLabTestBookingSms(
      phone,
      "LAB-20240620-ABC12",
      "2024-06-20 10:30 AM",
    );

    console.log("Testing Doctor Consultation...");
    await sendDoctorConsultationBookingSms(
      phone,
      "CONS-20240620-ABC12",
      "2024-06-25 02:00 PM",
    );

    console.log("Testing Payment Success...");
    await sendPaymentSuccessSms(phone, "ORD-20240620-ABC12", "2499");

    console.log("Testing Order Shipped...");
    await sendOrderShippedSms(phone, "ORD-20240620-ABC12", "TRK-987654");

    console.log("Testing Order Delivered...");
    await sendOrderDeliveredSms(phone, "ORD-20240620-ABC12");

    console.log("\n✅ All SMS tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testAllSms();
```

---

## 🔧 Integration Examples

### Example 1: Order Booking Integration

```typescript
// In your order creation handler
import { sendOrderConfirmationSms } from "@/lib/smsService";

async function createOrder(orderData) {
  try {
    // Create order in DB
    const order = await Order.create(orderData);

    // Send SMS notification
    try {
      await sendOrderConfirmationSms(order.phone, order.id);
    } catch (smsError) {
      console.error("SMS failed (non-blocking):", smsError);
      // Order created successfully even if SMS fails
    }

    return order;
  } catch (error) {
    throw error;
  }
}
```

### Example 2: Lab Test Booking Integration

```typescript
// In your lab test booking handler
import { sendLabTestBookingSms } from "@/lib/smsService";

async function bookLabTest(bookingData) {
  try {
    // Create booking in DB
    const booking = await LabTestBooking.create(bookingData);

    // Format date & time (e.g., "2024-06-20" + "10:30" → "2024-06-20 10:30 AM")
    const dateTime = formatDateForSms(booking.date, booking.time);

    // Send SMS notification
    try {
      await sendLabTestBookingSms(booking.phone, booking.id, dateTime);
    } catch (smsError) {
      console.error("SMS failed (non-blocking):", smsError);
    }

    return booking;
  } catch (error) {
    throw error;
  }
}

function formatDateForSms(date, time) {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${date} ${displayHour}:${minutes} ${ampm}`;
}
```

### Example 3: Doctor Consultation Integration

```typescript
// In your consultation booking handler
import { sendDoctorConsultationBookingSms } from "@/lib/smsService";

async function bookConsultation(consultationData) {
  try {
    // Create consultation in DB
    const consultation = await DoctorConsultation.create(consultationData);

    // Format date & time
    const dateTime = formatDateForSms(consultation.date, consultation.time);

    // Send SMS notification
    try {
      await sendDoctorConsultationBookingSms(
        consultation.phone,
        consultation.id,
        dateTime,
      );
    } catch (smsError) {
      console.error("SMS failed (non-blocking):", smsError);
    }

    return consultation;
  } catch (error) {
    throw error;
  }
}

function formatDateForSms(date, time) {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${date} ${displayHour}:${minutes} ${ampm}`;
}
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Pandeyra SMS credentials not configured"

**Solution:** Add environment variables to `.env.local`:

```env
PANDEYRA_SMS_USERNAME=MYSANJV
PANDEYRA_SMS_API_KEY=3938e5b8bdXX
```

### Issue: "Invalid phone number"

**Solution:** Phone must be 10-15 digits:

```typescript
// ❌ Wrong
sendOrderConfirmationSms("9876543210", "ORD-123");

// ✅ Correct
sendOrderConfirmationSms("+919876543210", "ORD-123");
sendOrderConfirmationSms("919876543210", "ORD-123");
```

### Issue: SMS not sent but no error

**Solution:** Check if test mode is enabled:

```env
SMS_TEST_MODE=false  # Make sure it's false for production
```

### Issue: "Invalid template"

**Solution:** Use valid template ID:

```typescript
// ❌ Wrong
sendSmsWithTemplate({ phone, templateId: "INVALID", variables: [] });

// ✅ Correct
sendSmsWithTemplate({
  phone,
  templateId: "ORDER_CONFIRMATION",
  variables: ["ORD-123"],
});
```

---

## 📊 SMS Template Format Reference

Each template uses `{#var#}` as variable placeholders:

```
Template: "Thank you for your order, Order ID: {#var#} Track your order..."
Variables: ["ORD-123456"]
Result:    "Thank you for your order, Order ID: ORD-123456 Track your order..."
```

---

## ✅ Checklist

- [ ] Environment variables added to `.env.local`
- [ ] Pandeyra account verified (username: MYSANJV)
- [ ] Sender ID registered (MSNJVI)
- [ ] SMS_TEST_MODE set to `false` for production
- [ ] Import SMS functions in API routes
- [ ] Error handling for SMS failures (non-blocking)
- [ ] SMS_TEST_MODE set to `true` during local development
- [ ] Test all templates before production deployment

---

## 📞 Support

For detailed documentation, see [SMS_INTEGRATION_GUIDE.md](SMS_INTEGRATION_GUIDE.md)

For API examples, check:

- [Order API](src/app/api/orders/with-sms/route.ts)
- [Lab Test API](src/app/api/lab-tests/book/with-sms/route.ts)
- [Doctor Consultation API](src/app/api/doctor-consultation/book/with-sms/route.ts)
