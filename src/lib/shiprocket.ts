import axios from 'axios';

const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL;
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD;
const SHIPROCKET_CHANNEL_ID = process.env.SHIPROCKET_CHANNEL_ID;
const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

let shiprocketToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getShiprocketToken(): Promise<string> {
  if (shiprocketToken && tokenExpiry && Date.now() < tokenExpiry) {
    return shiprocketToken;
  }

  if (!SHIPROCKET_EMAIL || !SHIPROCKET_PASSWORD) {
    throw new Error('Shiprocket credentials not configured');
  }

  try {
    const response = await axios.post(`${SHIPROCKET_BASE_URL}/auth/login`, {
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    });

    shiprocketToken = response.data.token as string;
    // Token typically expires in 24 hours, set expiry to 23 hours from now
    tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);

    return shiprocketToken;
  } catch (error: any) {
    console.error('Shiprocket login error:', error?.response?.data || error.message);
    throw new Error('Failed to authenticate with Shiprocket');
  }
}

export async function createShiprocketOrder(orderData: any): Promise<any> {
  const token = await getShiprocketToken();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/orders/create/adhoc`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Shiprocket create order error:', error?.response?.data || error.message);
    throw new Error('Failed to create Shiprocket order');
  }
}

export async function generateAWB(shipmentId: string): Promise<any> {
  const token = await getShiprocketToken();

  try {
    const response = await axios.post(
      `${SHIPROCKET_BASE_URL}/courier/assign/awb`,
      { shipment_id: shipmentId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Shiprocket generate AWB error:', error?.response?.data || error.message);
    throw new Error('Failed to generate AWB');
  }
}

/**
 * Get shipping rates from Shiprocket for a given pickup/delivery pincodes and weight.
 * Falls back to `process.env.DEFAULT_SHIPPING_CHARGE` (number) if Shiprocket call fails.
 */
export async function getShippingRates(options: { pickup_pincode: string; delivery_pincode: string; weightKg?: number; }): Promise<{ shippingCharge: number; courier?: string }>{
  const token = await getShiprocketToken();
  const { pickup_pincode, delivery_pincode, weightKg = 0.5 } = options;

  try {
    // Attempt serviceability/rates endpoint. Shiprocket docs offer multiple endpoints;
    // Try a common one and handle gracefully if it fails.
    const url = `${SHIPROCKET_BASE_URL}/courier/serviceability`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        pickup_postcode: pickup_pincode,
        delivery_postcode: delivery_pincode,
        weight: weightKg,
      },
    });

    // Response shape may vary. Try to extract a reasonable shipping charge.
    const data = resp.data;
    // Common shapes: { data: [{ courier: 'X', charge: 50, ... }, ...] } or resp.data[0]
    let charge = 0;
    let courier: string | undefined;

    if (Array.isArray(data?.data) && data.data.length > 0) {
      const first = data.data[0];
      charge = Number(first?.charge ?? first?.shipping_charge ?? first?.rate ?? 0) || 0;
      courier = first?.courier_name || first?.courier;
    } else if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      charge = Number(first?.charge ?? first?.shipping_charge ?? first?.rate ?? 0) || 0;
      courier = first?.courier_name || first?.courier;
    } else if (typeof data?.charge === 'number' || typeof data?.shipping_charge === 'number') {
      charge = Number(data.charge ?? data.shipping_charge ?? 0) || 0;
      courier = data.courier_name || data.courier;
    }

    // If no charge found, fallback to default env value
    if (!charge) {
      const envDefault = Number(process.env.DEFAULT_SHIPPING_CHARGE || 0);
      charge = Number.isFinite(envDefault) ? envDefault : 0;
    }

    return { shippingCharge: charge, courier };
  } catch (error: any) {
    console.error('Shiprocket getShippingRates error:', error?.response?.data || error?.message || error);
    const envDefault = Number(process.env.DEFAULT_SHIPPING_CHARGE || 0);
    return { shippingCharge: Number.isFinite(envDefault) ? envDefault : 0 };
  }
}

/**
 * Track shipment by AWB or shipment id. Uses common tracking endpoint shapes; returns raw response when available.
 */
export async function trackShipment(identifier: { awb?: string; shipment_id?: string; order_id?: string; }){
  const token = await getShiprocketToken();
  try {
    if (identifier.awb) {
      const resp = await axios.get(`${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(identifier.awb)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return resp.data;
    }

    if (identifier.shipment_id) {
      const resp = await axios.get(`${SHIPROCKET_BASE_URL}/shipments/${encodeURIComponent(identifier.shipment_id)}/track`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return resp.data;
    }

    if (identifier.order_id) {
      const resp = await axios.get(`${SHIPROCKET_BASE_URL}/orders/${encodeURIComponent(identifier.order_id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return resp.data;
    }

    throw new Error('No valid identifier provided for tracking');
  } catch (error: any) {
    console.error('Shiprocket trackShipment error:', error?.response?.data || error?.message || error);
    throw new Error('Failed to fetch tracking info');
  }
}