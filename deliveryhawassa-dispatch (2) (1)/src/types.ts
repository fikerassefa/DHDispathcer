export type OrderStatus = 'pending' | 'assigned' | 'picked_up' | 'on_the_way' | 'delivered' | 'expired' | 'cancelled';

export interface Order {
  id: string;
  restaurantName: string;
  pickupLocation: string;
  deliveryLocation: string;
  pickupCoords: { lat: number; lng: number };
  deliveryCoords: { lat: number; lng: number };
  customerName: string;
  customerPhone: string;
  notes: string;
  status: OrderStatus;
  assignedDriverId?: string;
  estimatedArrivalAt?: number;
  deliveryPrice: number;
  createdAt: number;
  rating?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  isVerified: boolean;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  totalRatings?: number;
  registrationData?: {
    nationalId: string;
    phoneNumber: string;
    depositConfirmed: boolean;
    visitConfirmed: boolean;
    idPhoto?: string; // Base64 or URL
  };
}

export interface TelegramMessage {
  id: string;
  orderId: string;
  driverId: string;
  timestamp: number;
}
