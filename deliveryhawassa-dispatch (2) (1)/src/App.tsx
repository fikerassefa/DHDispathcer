/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Package, 
  MapPin, 
  User, 
  Phone, 
  ClipboardList,
  Clock,
  Navigation,
  CheckCircle,
  AlertCircle,
  Smartphone,
  LayoutDashboard,
  Users,
  History,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  BellOff,
  ArrowLeft,
  ExternalLink,
  Search,
  Star,
  Bike,
  Map as MapIcon,
  LogOut,
  ShieldCheck,
  UserCog,
  Wallet as WalletIcon,
  MessageSquare,
  CreditCard,
  Plus,
  Minus,
  UserPlus,
  Menu,
  X,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Order, OrderStatus, Driver } from './types';
import CustomerStatusChecker from './components/CustomerStatusChecker';
// import LoginPage from './components/LoginPage';
import WalletView from './components/WalletView';
import ChatView from './components/ChatView';

// Firebase imports removed as requested for local development
/*
import { db, auth } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy, 
  where,
  getDoc,
  getDocs,
  getDocFromServer,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
*/

// Mock Firebase objects for local development
const db: any = {};
const auth: any = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signOut: () => Promise.resolve(),
};

import { DriverRegistrationForm } from './components/DriverRegistrationForm';

type UserRole = 'super_admin' | 'dispatcher' | 'sub_admin';

interface UserSession {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt?: number;
}

interface Wallet {
  driverId: string;
  balance: number;
  totalEarned: number;
}

interface Message {
  id: string;
  senderId: string;
  senderRole: 'dispatcher' | 'driver';
  text: string;
  timestamp: number;
  read?: boolean;
}

// Mock Drivers
const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Alex Johnson', phone: '+251 911 223 344', isAvailable: true, isVerified: true, location: { lat: 9.0227, lng: 38.7460 } },
  { id: 'd2', name: 'Sarah Smith', phone: '+251 922 334 455', isAvailable: true, isVerified: true, location: { lat: 9.0350, lng: 38.7520 } },
  { id: 'd3', name: 'Mike Ross', phone: '+251 933 445 566', isAvailable: true, isVerified: true, location: { lat: 9.0180, lng: 38.7610 } },
];

export default function App() {
  const [user, setUser] = useState<UserSession | null>({
    uid: 'admin-local',
    email: 'admin@delivery.com',
    role: 'super_admin',
    displayName: 'Local Admin'
  });
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-DEMO1',
      customerName: 'John Doe',
      customerPhone: '+251 911 000 111',
      pickupLocation: 'Piazza, Addis Ababa',
      deliveryLocation: 'Bole, Addis Ababa',
      pickupCoords: { lat: 9.035, lng: 38.75 },
      deliveryCoords: { lat: 9.01, lng: 38.78 },
      status: 'pending',
      deliveryPrice: 150,
      createdAt: Date.now()
    }
  ]);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [activeView, setActiveView] = useState<'dispatcher' | 'drivers' | 'monitor' | 'history' | 'analytics' | 'customer' | 'wallets' | 'chat' | 'roles'>('dispatcher');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(INITIAL_DRIVERS[0].id);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(0.8); // 80% to driver by default
  const [customerOrderId, setCustomerOrderId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>({});

  // Firebase listeners removed for local development
  /*
  useEffect(() => { ... });
  */

  const handleSendMessage = async (driverId: string, text: string) => {
    if (!user) return;
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.uid,
      senderRole: 'dispatcher',
      text,
      timestamp: Date.now()
    };
    setChatMessages(prev => ({
      ...prev,
      [driverId]: [...(prev[driverId] || []), message]
    }));
  };

  const handleApprovePayout = async (payoutId: string) => {
    console.log('Approving payout:', payoutId);
  };

  const handleRegisterDriver = async (driverId: string, registrationData: any) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? {
      ...d,
      isVerified: true,
      registrationData,
      phone: `+251 ${registrationData.phoneNumber}`
    } : d));
  };

  const rateDriver = async (orderId: string, rating: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.assignedDriverId) return;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, rating } : o));
    
    setDrivers(prev => prev.map(d => {
      if (d.id === order.assignedDriverId) {
        const currentRating = d.rating || 0;
        const currentTotal = d.totalRatings || 0;
        const newTotal = currentTotal + 1;
        const newRating = (currentRating * currentTotal + rating) / newTotal;
        return { ...d, rating: newRating, totalRatings: newTotal };
      }
      return d;
    }));
  };

  // Simulate driver movement (local state only)
  useEffect(() => {
    if (!user || activeView !== 'monitor') return;

    const interval = setInterval(() => {
      setDrivers(prev => prev.map(driver => {
        if (driver.isAvailable) {
          const drift = 0.0001;
          return {
            ...driver,
            location: {
              lat: driver.location.lat + (Math.random() - 0.5) * drift,
              lng: driver.location.lng + (Math.random() - 0.5) * drift
            }
          };
        }
        return driver;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [user, activeView]);

  const createOrder = async (newOrder: Omit<Order, 'id' | 'status' | 'createdAt' | 'pickupCoords' | 'deliveryCoords'>) => {
    const orderId = `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const order: Order = {
      ...newOrder,
      id: orderId,
      pickupCoords: { 
        lat: 9.02 + (Math.random() - 0.5) * 0.05, 
        lng: 38.74 + (Math.random() - 0.5) * 0.05 
      },
      deliveryCoords: { 
        lat: 9.02 + (Math.random() - 0.5) * 0.05, 
        lng: 38.74 + (Math.random() - 0.5) * 0.05 
      },
      status: 'pending',
      createdAt: Date.now()
    };
    setOrders(prev => [order, ...prev]);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, driverId?: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, assignedDriverId: driverId || o.assignedDriverId } : o));

    if (status === 'assigned' && driverId) {
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, isAvailable: false } : d));
    } else if (status === 'delivered' && driverId) {
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, isAvailable: true } : d));
      
      // Update Wallet
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const driverEarning = order.price * commissionRate;
        setWallets(prev => {
          const w = prev[driverId] || { driverId, balance: 0, totalEarned: 0 };
          return {
            ...prev,
            [driverId]: {
              ...w,
              balance: w.balance + driverEarning,
              totalEarned: w.totalEarned + driverEarning
            }
          };
        });
      }
    }
  };

  const handleLogout = async () => {
    // Mock logout - just reload
    window.location.reload();
  };

  const exportCustomers = () => {
    const uniqueCustomers = new Map<string, { name: string, phone: string }>();
    orders.forEach(order => {
      if (order.customerPhone) {
        uniqueCustomers.set(order.customerPhone, {
          name: order.customerName,
          phone: order.customerPhone
        });
      }
    });

    const customerList = Array.from(uniqueCustomers.values());
    if (customerList.length === 0) {
      alert('No customers found to export.');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Phone\n"
      + customerList.map(c => `"${c.name}","${c.phone}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <div className="text-xl font-bold tracking-tight">DeliveryHawassa</div>
        <p className="text-slate-400 text-sm">Loading local environment...</p>
      </div>
    );
  }

  // Login page bypassed as requested
  /*
  if (!user) {
    return <LoginPage onLogin={() => {}} />;
  }
  */

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-white shadow-2xl z-[70] flex flex-col border-r border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-[#134e4a] p-2 rounded-full">
                  <Bike className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight">Menu</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Management</p>
              
              {(user.role === 'super_admin' || user.role === 'sub_admin') && (
                <SidebarItem 
                  active={activeView === 'roles'} 
                  onClick={() => { setActiveView('roles'); setSidebarOpen(false); }}
                  icon={<ShieldCheck size={20} />}
                  label="Roles & Permissions"
                />
              )}
              
              <SidebarItem 
                active={activeView === 'history'} 
                onClick={() => { setActiveView('history'); setSidebarOpen(false); }}
                icon={<History size={20} />}
                label="Order History"
              />
              
              <SidebarItem 
                active={activeView === 'wallets'} 
                onClick={() => { setActiveView('wallets'); setSidebarOpen(false); }}
                icon={<WalletIcon size={20} />}
                label="Driver Wallets"
              />
              
              <SidebarItem 
                active={activeView === 'chat'} 
                onClick={() => { setActiveView('chat'); setSidebarOpen(false); }}
                icon={<MessageSquare size={20} />}
                label="Support Chat"
              />

              {(user.role === 'super_admin' || user.role === 'sub_admin') && (
                <SidebarItem 
                  active={activeView === 'analytics'} 
                  onClick={() => { setActiveView('analytics'); setSidebarOpen(false); }}
                  icon={<TrendingUp size={20} />}
                  label="Analytics"
                />
              )}
            </div>

            <div className="p-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {user.displayName?.[0] || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{user.displayName}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <Menu size={24} />
              </button>

              <div className="flex items-center gap-2">
                <div className="bg-[#134e4a] p-2 rounded-full">
                  <Bike className="text-white w-6 h-6" />
                </div>
                <span className="font-bold text-xl tracking-tight hidden sm:inline">DeliveryHawassa Dispatch</span>
              </div>
              
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                {user.role === 'super_admin' ? (
                  <ShieldCheck size={16} className="text-teal-600" />
                ) : (
                  <UserCog size={16} className="text-blue-600" />
                )}
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {user.role === 'super_admin' ? 'Super Admin' : user.role === 'sub_admin' ? 'Sub Admin' : 'Dispatcher'}
                </span>
              </div>
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <NavButton 
                active={activeView === 'dispatcher'} 
                onClick={() => setActiveView('dispatcher')}
                icon={<Send size={18} />}
                label="Dispatcher"
              />
              <NavButton 
                active={activeView === 'drivers'} 
                onClick={() => setActiveView('drivers')}
                icon={<Smartphone size={18} />}
                label="Driver App"
              />
              <NavButton 
                active={activeView === 'monitor'} 
                onClick={() => setActiveView('monitor')}
                icon={<LayoutDashboard size={18} />}
                label="Monitor"
              />
              <NavButton 
                active={activeView === 'customer'} 
                onClick={() => setActiveView('customer')}
                icon={<User size={18} />}
                label="Track Order"
              />
              
              <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                title="Log Out"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <AnimatePresence mode="wait">
          {activeView === 'dispatcher' && (
            <motion.div
              key="dispatcher"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DispatcherPanel onCreateOrder={createOrder} />
            </motion.div>
          )}

          {activeView === 'drivers' && (
            <motion.div
              key="drivers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <div className="w-full max-w-md mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Active Driver Simulator</label>
                <div className="grid grid-cols-3 gap-2">
                  {drivers.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDriverId(d.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDriverId === d.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {d.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <TelegramSimulator 
                driver={drivers.find(d => d.id === selectedDriverId)!}
                orders={orders}
                messages={chatMessages[selectedDriverId] || []}
                onSendMessage={(text) => handleSendMessage(selectedDriverId, text)}
                onUpdateStatus={updateOrderStatus}
              />
            </motion.div>
          )}

          {activeView === 'monitor' && (
            selectedProfileId ? (
              <DriverProfile 
                driver={drivers.find(d => d.id === selectedProfileId)!}
                orders={orders}
                commissionRate={commissionRate}
                onBack={() => setSelectedProfileId(null)}
              />
            ) : (
              <SystemMonitor 
                orders={orders} 
                drivers={drivers} 
                commissionRate={commissionRate}
                onRateChange={setCommissionRate}
                onViewProfile={(id) => setSelectedProfileId(id)}
                onExportCustomers={exportCustomers}
                onAddDriver={(name) => {
                  const newDriver: Driver = {
                    id: 'd' + (drivers.length + 1),
                    name,
                    phone: '+251 9' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
                    isAvailable: true,
                    isVerified: false,
                    location: { 
                      lat: 9.02 + (Math.random() - 0.5) * 0.05, 
                      lng: 38.74 + (Math.random() - 0.5) * 0.05 
                    }
                  };
                  setDrivers(prev => [...prev, newDriver]);
                }}
              />
            )
          )}

          {activeView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OrderHistory orders={orders} drivers={drivers} />
            </motion.div>
          )}

          {activeView === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <DriverAnalytics orders={orders} drivers={drivers} commissionRate={commissionRate} />
            </motion.div>
          )}

          {activeView === 'customer' && (
            <motion.div
              key="customer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CustomerStatusChecker 
                orders={orders} 
                drivers={drivers}
                orderId={customerOrderId}
                onOrderIdChange={setCustomerOrderId}
                onRateDriver={rateDriver}
              />
            </motion.div>
          )}

          {activeView === 'wallets' && (
            <motion.div
              key="wallets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <WalletView 
                drivers={drivers} 
                wallets={wallets}
                onApprovePayout={handleApprovePayout}
              />
            </motion.div>
          )}

          {activeView === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8"
            >
              <ChatView 
                drivers={drivers} 
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            </motion.div>
          )}

          {(activeView === 'roles' && (user.role === 'super_admin' || user.role === 'sub_admin')) && (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RolesView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
        ? 'bg-white text-blue-600 shadow-sm' 
        : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function SidebarItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        active 
        ? 'bg-blue-50 text-blue-600' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-blue-100' : 'bg-slate-100'}`}>
        {icon}
      </div>
      {label}
    </button>
  );
}

function DispatcherPanel({ onCreateOrder }: { onCreateOrder: (order: any) => void }) {
  const [formData, setFormData] = useState({
    restaurantName: '',
    pickupLocation: '',
    deliveryLocation: '',
    customerName: '',
    customerPhone: '',
    deliveryPrice: '5.00',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOrder({
      ...formData,
      deliveryPrice: parseFloat(formData.deliveryPrice) || 0
    });
    setFormData({
      restaurantName: '',
      pickupLocation: '',
      deliveryLocation: '',
      customerName: '',
      customerPhone: '',
      deliveryPrice: '5.00',
      notes: ''
    });
  };

  const quickFill = () => {
    setFormData({
      restaurantName: 'Burger King #42',
      pickupLocation: '123 Fast Food Ave, Downtown',
      deliveryLocation: '789 Residential St, Apt 4B',
      customerName: 'John Doe',
      customerPhone: '+1 (555) 012-3456',
      deliveryPrice: '7.50',
      notes: 'Extra napkins please. Gate code: 1234'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Send className="text-blue-600" size={24} />
          Dispatch New Order
        </h2>
        <button 
          onClick={quickFill}
          className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
        >
          Quick Fill Demo
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Restaurant Name</label>
            <input
              required
              value={formData.restaurantName}
              onChange={e => setFormData({...formData, restaurantName: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Pizza Hut"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name</label>
            <input
              required
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. Jane Smith"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pickup Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              required
              value={formData.pickupLocation}
              onChange={e => setFormData({...formData, pickupLocation: e.target.value})}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Full address"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Location</label>
          <div className="relative">
            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              required
              value={formData.deliveryLocation}
              onChange={e => setFormData({...formData, deliveryLocation: e.target.value})}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Full address"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                required
                value={formData.customerPhone}
                onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="+1..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delivery Price (ETB)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">ETB</span>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.deliveryPrice}
                onChange={e => setFormData({...formData, deliveryPrice: e.target.value})}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Notes</label>
          <input
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Optional notes"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
        >
          <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          Dispatch to Available Drivers
        </button>
      </form>
    </div>
  );
}

function TelegramSimulator({ driver, orders, messages, onSendMessage, onUpdateStatus }: { 
  driver: Driver, 
  orders: Order[], 
  messages: Message[],
  onSendMessage: (text: string) => void,
  onUpdateStatus: (id: string, status: OrderStatus, driverId?: string) => void
}) {
  const [notification, setNotification] = useState<{ id: string, restaurant: string } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const prevOrdersCount = React.useRef(orders.length);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  useEffect(() => {
    if (orders.length > prevOrdersCount.current) {
      const newOrder = orders[orders.length - 1];
      if (newOrder.status === 'pending') {
        if (notificationsEnabled) {
          setNotification({ id: newOrder.id, restaurant: newOrder.restaurantName });
          
          // Play notification sound
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
          } catch (e) {
            console.log('Audio init failed:', e);
          }

          // Auto-hide after 5 seconds
          const timer = setTimeout(() => {
            setNotification(null);
          }, 5000);
          
          return () => clearTimeout(timer);
        }
      }
    }
    prevOrdersCount.current = orders.length;
  }, [orders, notificationsEnabled]);

  const driverOrders = orders.filter(o => 
    o.status === 'pending' || o.assignedDriverId === driver.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = driverOrders.filter(o => o.status === 'pending').length;

  const GEBETA_API_KEY = import.meta.env.VITE_GEBETA_MAP_API_KEY;
  const tileLayerUrl = GEBETA_API_KEY 
    ? `https://api.gebeta.app/v1/map/tiles/{z}/{x}/{y}.png?key=${GEBETA_API_KEY}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="w-full max-w-md bg-[#242F3D] rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden aspect-[9/19] flex flex-col relative">
      {/* Notification Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-12 left-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-blue-400/30 backdrop-blur-md"
          >
            <div className="bg-white/20 p-2 rounded-xl">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">New Dispatch</p>
              <p className="text-sm font-bold truncate">Order from {notification.restaurant}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="text-white/50 hover:text-white"
            >
              <XCircle size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
      
      {/* Telegram Header */}
      <div className="bg-[#17212B] pt-8 pb-3 px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#134e4a] flex items-center justify-center text-white">
            <Bike size={20} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">DeliveryhawassaDriverbot</h3>
            <p className="text-blue-400 text-xs">bot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setShowMap(!showMap); setShowChat(false); }}
            className={`p-2 rounded-full transition-colors ${showMap ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            <MapIcon size={18} />
          </button>
          <button 
            onClick={() => { setShowChat(!showChat); setShowMap(false); }}
            className={`p-2 rounded-full relative transition-colors ${showChat ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            <MessageSquare size={18} />
            {messages.filter(m => m.senderRole === 'dispatcher' && !m.read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {messages.filter(m => m.senderRole === 'dispatcher' && !m.read).length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`p-2 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}
          >
            {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            {notificationsEnabled && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden bg-[#0E1621]">
        <AnimatePresence mode="wait">
          {showMap ? (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0"
            >
              <MapContainer 
                key={`map-${driver.id}`}
                center={[driver.location.lat, driver.location.lng]} 
                zoom={14} 
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer 
                  attribution='&copy; <a href="https://gebeta.app">Gebeta Maps</a>'
                  url={tileLayerUrl} 
                />
                <Marker position={[driver.location.lat, driver.location.lng]} icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div class="w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32]
                })}>
                  <Popup>You are here</Popup>
                </Marker>
                {driverOrders.filter(o => o.status === 'on_the_way' || o.status === 'assigned').map(order => (
                  <Marker 
                    key={order.id} 
                    position={[order.deliveryCoords.lat, order.deliveryCoords.lng]}
                    icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div class="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 24]
                    })}
                  >
                    <Popup>Order #{order.id.split('-')[1]}</Popup>
                  </Marker>
                ))}
              </MapContainer>
              <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                <div className="bg-[#17212B]/90 backdrop-blur-sm p-3 rounded-2xl border border-blue-500/30 text-white shadow-xl">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Real-time Gebeta Map</p>
                  <p className="text-xs font-medium">Tracking {driverOrders.filter(o => o.status === 'on_the_way' || o.status === 'assigned').length} active deliveries</p>
                </div>
              </div>
            </motion.div>
          ) : showChat ? (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-[#0E1621] flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center px-6">
                    <MessageSquare size={32} className="mb-2 opacity-20" />
                    <p className="text-xs">No messages yet. Start a conversation with the dispatcher.</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex ${m.senderRole === 'driver' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        m.senderRole === 'driver' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-[#18222D] text-slate-200 rounded-tl-none border border-slate-800'
                      }`}>
                        <p>{m.text}</p>
                        <p className="text-[10px] opacity-50 mt-1 text-right">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 bg-[#17212B] border-t border-slate-800 flex items-center gap-2">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && chatInput.trim() && (onSendMessage(chatInput), setChatInput(''))}
                  placeholder="Type a message..."
                  className="flex-1 bg-[#242F3D] border-none rounded-full px-4 py-2 text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={() => chatInput.trim() && (onSendMessage(chatInput), setChatInput(''))}
                  className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              <div className="text-center">
                <span className="bg-[#18222D] text-slate-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest">Today</span>
              </div>

              {/* Messages List */}
              {driverOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center opacity-30">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Bike size={32} className="text-slate-600" />
                  </div>
                  <h3 className="text-slate-300 font-bold mb-1">No Active Orders</h3>
                  <p className="text-slate-500 text-xs">Waiting for new delivery requests from the dispatcher...</p>
                </div>
              )}

              {driverOrders.map(order => (
                <TelegramMessage 
                  key={order.id} 
                  order={order} 
                  driver={driver}
                  orders={orders}
                  onUpdateStatus={onUpdateStatus}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Telegram Input Area */}
      <div className="bg-[#17212B] p-3 flex flex-col gap-3">
        <div className="flex gap-2">
          <button className="flex-1 bg-slate-800 text-slate-400 text-[10px] font-bold py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors">
            ❓ HELP
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#242F3D] rounded-full px-4 py-2 text-slate-400 text-sm">
            Message
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
            <Smartphone size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface TelegramMessageProps {
  key?: React.Key;
  order: Order;
  driver: Driver;
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus, driverId?: string) => void;
}

function TelegramMessage({ order, driver, orders, onUpdateStatus }: TelegramMessageProps) {
  const isAssignedToMe = order.assignedDriverId === driver.id;
  const isPending = order.status === 'pending';
  const isBusy = orders.some(o => o.assignedDriverId === driver.id && o.status !== 'delivered');
  
  const handleAction = (status: OrderStatus) => {
    if (!driver.isVerified && status === 'assigned') return;
    onUpdateStatus(order.id, status, driver.id);
  };

  const getETALabel = () => {
    if (!order.estimatedArrivalAt) return null;
    const mins = Math.max(0, Math.round((order.estimatedArrivalAt - Date.now()) / 60000));
    if (order.status === 'assigned') return `ETA to Pickup: ${mins}m`;
    if (order.status === 'on_the_way') return `ETA to Delivery: ${mins}m`;
    return null;
  };

  const etaLabel = getETALabel();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="max-w-[90%] bg-[#18222D] rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-800/50"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-blue-400 font-bold text-xs">📦 NEW ORDER #{order.id.split('-')[1]}</span>
        <span className="text-slate-500 text-[10px]">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="mb-3 flex items-center justify-between bg-green-500/10 text-green-400 px-3 py-2 rounded-xl border border-green-500/20">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold">ETB</span>
          <span className="text-xs font-bold">Delivery Fee</span>
        </div>
        <span className="text-sm font-black">{(order.deliveryPrice || 0).toFixed(2)} ETB</span>
      </div>

      <div className="mb-3 space-y-1 bg-blue-500/5 p-2 rounded-xl border border-blue-500/10">
        <div className="flex items-center gap-2">
          <User size={12} className="text-blue-400" />
          <span className="text-xs font-bold text-slate-200">{order.customerName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={12} className="text-blue-400" />
          <span className="text-xs text-slate-400">{order.customerPhone}</span>
        </div>
      </div>

      {etaLabel && (
        <div className="mb-3 flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg text-[10px] font-bold border border-blue-500/20">
          <Clock size={12} />
          {etaLabel}
        </div>
      )}

      <div className="space-y-2 text-slate-200 text-sm">
        <div className="flex gap-2">
          <Package size={14} className="text-slate-500 mt-0.5 shrink-0" />
          <p><span className="text-slate-400">From:</span> <span className="font-semibold">{order.restaurantName}</span></p>
        </div>
        <div className="flex gap-2">
          <MapPin size={14} className="text-slate-500 mt-0.5 shrink-0" />
          <p><span className="text-slate-400">Pickup:</span> {order.pickupLocation}</p>
        </div>
        <div className="flex gap-2">
          <Navigation size={14} className="text-slate-500 mt-0.5 shrink-0" />
          <p><span className="text-slate-400">Drop:</span> {order.deliveryLocation}</p>
        </div>
        
        {isAssignedToMe && order.notes && (
          <div className="pt-2 border-t border-slate-800 mt-2 space-y-2">
            <div className="flex gap-2">
              <ClipboardList size={14} className="text-slate-500 mt-0.5 shrink-0" />
              <p className="italic text-slate-400 text-xs">"{order.notes}"</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {isPending ? (
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleAction('assigned')}
              disabled={isBusy}
              className={`font-bold py-2 rounded-lg text-xs transition-colors ${
                isBusy 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isBusy ? 'BUSY' : 'ACCEPT'}
            </button>
            <button 
              className="bg-[#242F3D] hover:bg-[#2C3949] text-slate-300 font-bold py-2 rounded-lg text-xs transition-colors"
            >
              REJECT
            </button>
          </div>
        ) : isAssignedToMe ? (
          <div className="space-y-2">
            {order.status === 'assigned' && (
              <button 
                onClick={() => handleAction('picked_up')}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                MARK AS PICKED UP
              </button>
            )}
            {order.status === 'picked_up' && (
              <button 
                onClick={() => handleAction('on_the_way')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                START DELIVERY
              </button>
            )}
            {order.status === 'on_the_way' && (
              <button 
                onClick={() => handleAction('delivered')}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-xs transition-colors"
              >
                MARK AS DELIVERED
              </button>
            )}
            {order.status === 'delivered' && (
              <div className="flex items-center justify-center gap-2 py-2 bg-green-900/20 text-green-400 rounded-lg text-xs font-bold">
                <CheckCircle size={14} />
                ORDER COMPLETED
              </div>
            )}
          </div>
        ) : (
          <div className="py-2 bg-slate-800/50 text-slate-500 rounded-lg text-center text-xs font-medium">
            Order assigned to another driver
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FleetMap({ drivers, orders }: { drivers: Driver[], orders: Order[] }) {
  const gebetaKey = import.meta.env.VITE_GEBETA_MAP_API_KEY;
  // Gebeta Maps tile URL
  const tileUrl = gebetaKey 
    ? `https://api.gebeta.app/v1/map/tiles/{z}/{x}/{y}.png?key=${gebetaKey}`
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <MapContainer 
        center={[9.03, 38.74]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        {drivers.map(driver => {
          const activeOrder = orders.find(o => o.assignedDriverId === driver.id && !['delivered', 'expired'].includes(o.status));
          
          const driverIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg ${driver.isAvailable ? 'bg-green-500' : 'bg-amber-500'} text-white font-bold text-xs">
                    ${driver.name.charAt(0)}
                  </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          return (
            <Marker 
              key={driver.id} 
              position={[driver.location.lat, driver.location.lng]}
              icon={driverIcon}
            >
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm">{driver.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                    {driver.isAvailable ? 'Available' : 'On Delivery'}
                  </p>
                  {activeOrder && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase">Active Order</p>
                      <p className="text-xs font-medium">{activeOrder.restaurantName}</p>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function SystemMonitor({ orders, drivers, commissionRate, onRateChange, onAddDriver, onViewProfile, onExportCustomers }: { 
  orders: Order[], 
  drivers: Driver[], 
  commissionRate: number,
  onRateChange: (rate: number) => void,
  onAddDriver: (name: string) => void,
  onViewProfile: (id: string) => void,
  onExportCustomers: () => void
}) {
  const [newDriverName, setNewDriverName] = useState('');
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.deliveryPrice, 0);
  const driverShare = totalRevenue * commissionRate;
  const companyShare = totalRevenue * (1 - commissionRate);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    active: orders.filter(o => ['assigned', 'picked_up', 'on_the_way'].includes(o.status)).length,
    completed: completedOrders.length,
    expired: orders.filter(o => o.status === 'expired').length,
  };

  const calculateETA = (order: Order, driver?: Driver) => {
    if (!driver || !['assigned', 'on_the_way'].includes(order.status)) return null;
    
    const target = order.status === 'assigned' ? order.pickupCoords : order.deliveryCoords;
    const label = order.status === 'assigned' ? 'Pickup' : 'Delivery';
    
    // Simple Euclidean distance (approx 111km per degree)
    const dx = (driver.location.lng - target.lng) * 111;
    const dy = (driver.location.lat - target.lat) * 111;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // Heuristic: 2 mins per km (approx 30km/h in city traffic)
    const mins = Math.round(distance * 2);
    return { label, mins };
  };

  return (
    <div className="space-y-6">
      {/* Revenue Split Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 p-3 rounded-xl">
              <BarChart3 className="text-slate-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-3xl font-black text-slate-900">{(totalRevenue || 0).toFixed(2)} ETB</h3>
            </div>
          </div>
          <span className="text-slate-500 opacity-20 font-black text-4xl">ETB</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <Users className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Driver Payout ({Math.round(commissionRate * 100)}%)</p>
              <h3 className="text-3xl font-black text-slate-900">{(driverShare || 0).toFixed(2)} ETB</h3>
            </div>
          </div>
          <TrendingUp className="text-green-500 opacity-20" size={48} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <LayoutDashboard className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Company Comm. ({Math.round((1 - commissionRate) * 100)}%)</p>
              <h3 className="text-3xl font-black text-slate-900">{(companyShare || 0).toFixed(2)} ETB</h3>
            </div>
          </div>
          <span className="text-blue-500 opacity-20 font-black text-4xl">ETB</span>
        </div>
      </div>

      {/* Dedicated Settings Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600/10 p-2 rounded-lg">
                <Settings size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Platform Configuration</h3>
                <p className="text-xs text-slate-500">Adjust global commission splits</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={Math.round(commissionRate * 100)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) onRateChange(Math.min(100, Math.max(0, val)) / 100);
                  }}
                  className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-center"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider text-xs">Driver Commission</label>
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {Math.round(commissionRate * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={commissionRate * 100}
              onChange={(e) => onRateChange(parseInt(e.target.value) / 100)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-600/10 p-2 rounded-lg">
              <TrendingUp size={20} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Marketing & CRM</h3>
              <p className="text-xs text-slate-500">Export customer data for SMS marketing</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={onExportCustomers}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-100 transition-all group"
            >
              <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
              Export Customer List (CSV)
            </button>
            <p className="text-[10px] text-slate-400 text-center italic">
              Contains unique customer names and phone numbers from all orders.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Orders" value={stats.total} icon={<Package className="text-blue-600" />} />
        <StatCard label="Pending" value={stats.pending} icon={<Clock className="text-amber-600" />} />
        <StatCard label="In Progress" value={stats.active} icon={<Navigation className="text-indigo-600" />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 className="text-green-600" />} />
        <StatCard label="Expired" value={stats.expired} icon={<AlertCircle className="text-red-600" />} />
      </div>

      {/* Fleet Map */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h3 className="font-bold flex items-center gap-2">
            <MapPin size={18} className="text-slate-500" />
            Real-Time Fleet Map
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-slate-500">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-slate-500">On Delivery</span>
            </div>
            <div className="h-4 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                placeholder="New Driver Name" 
                className="px-2 py-1 border rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
              />
              <button 
                onClick={() => {
                  if (newDriverName.trim()) {
                    onAddDriver(newDriverName);
                    setNewDriverName('');
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                Add Driver
              </button>
            </div>
          </div>
        </div>
        <FleetMap drivers={drivers} orders={orders} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <ClipboardList size={18} className="text-slate-500" />
              Live Order Stream
            </h3>
            <span className="text-xs text-slate-400">Updates in real-time</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4">Driver</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">ETA</th>
                  <th className="px-6 py-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No orders dispatched yet
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{order.id}</td>
                      <td className="px-6 py-4 text-sm font-medium">{order.restaurantName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {order.assignedDriverId 
                          ? drivers.find(d => d.id === order.assignedDriverId)?.name 
                          : <span className="text-slate-300">Unassigned</span>
                        }
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const driver = drivers.find(d => d.id === order.assignedDriverId);
                          const eta = calculateETA(order, driver);
                          if (!eta) return <span className="text-slate-300">-</span>;
                          return (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-blue-600 uppercase leading-tight">ETA to {eta.label}</span>
                              <span className="text-xs font-medium">{eta.mins}m</span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drivers List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold flex items-center gap-2">
              <Users size={18} className="text-slate-500" />
              Driver Fleet
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {drivers.map(driver => (
              <div 
                key={driver.id} 
                onClick={() => onViewProfile(driver.id)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    driver.isAvailable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold group-hover:text-blue-600 transition-colors">{driver.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">
                        {driver.isAvailable ? 'Available' : 'On Delivery'}
                      </p>
                      {driver.rating && (
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star size={10} className="fill-amber-500" />
                          <span className="text-[10px] font-bold">{(driver.rating || 0).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${driver.isAvailable ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverAnalytics({ orders, drivers, commissionRate }: { orders: Order[], drivers: Driver[], commissionRate: number }) {
  const completedOrders = orders.filter(o => o.status === 'delivered');
  
  const getStats = (driverId: string, timeframe: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const driverOrders = completedOrders.filter(o => o.assignedDriverId === driverId);
    
    const filtered = driverOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      if (timeframe === 'daily') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (timeframe === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo;
      }
      if (timeframe === 'monthly') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const earnings = filtered.reduce((sum, o) => sum + o.deliveryPrice, 0);
    const driverShare = earnings * commissionRate;
    return { count: filtered.length, earnings: driverShare };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            Driver Performance Analytics
          </h2>
          <p className="text-slate-500 text-sm mt-1">Track earnings and order volumes across different timeframes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {drivers.map(driver => {
          const daily = getStats(driver.id, 'daily');
          const weekly = getStats(driver.id, 'weekly');
          const monthly = getStats(driver.id, 'monthly');

          return (
            <div key={driver.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    {driver.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-lg">{driver.name}</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Driver ID: {driver.id}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                <TimeframeStats timeframe="Daily" stats={daily} color="blue" commissionRate={commissionRate} />
                <TimeframeStats timeframe="Weekly" stats={weekly} color="indigo" commissionRate={commissionRate} />
                <TimeframeStats timeframe="Monthly" stats={monthly} color="purple" commissionRate={commissionRate} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeframeStats({ timeframe, stats, color, commissionRate }: { timeframe: string, stats: { count: number, earnings: number }, color: string, commissionRate: number }) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    purple: 'text-purple-600 bg-purple-50'
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{timeframe}</span>
        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${colorClasses[color]}`}>
          Net Earnings
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-medium">Orders</p>
          <p className="text-2xl font-black">{stats.count}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-slate-400 font-medium">Est. Payout ({Math.round(commissionRate * 100)}%)</p>
          <p className="text-2xl font-black text-green-600">{(stats.earnings || 0).toFixed(2)} ETB</p>
        </div>
      </div>
    </div>
  );
}

function OrderHistory({ orders, drivers }: { orders: Order[], drivers: Driver[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const historyOrders = orders.filter(o => 
    (o.status === 'delivered' || o.status === 'expired') &&
    (o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     o.customerPhone.includes(searchQuery) ||
     o.id.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(historyOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = historyOrders.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-6xl mx-auto">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <History size={22} className="text-slate-500" />
          Order Dispatch History
        </h3>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
          Total: {historyOrders.length} records
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Restaurant</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Delivery Location</th>
              <th className="px-6 py-4">Driver</th>
              <th className="px-6 py-4">Completed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">
                  No historical records found
                </td>
              </tr>
            ) : (
              paginatedOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{order.id}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{order.restaurantName}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{order.customerName}</div>
                    <div className="text-xs text-slate-500">{order.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{order.deliveryLocation}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {order.assignedDriverId 
                      ? drivers.find(d => d.id === order.assignedDriverId)?.name 
                      : <span className="text-slate-300">N/A</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, historyOrders.length)}</span> of <span className="font-medium">{historyOrders.length}</span>
          </div>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center px-4 text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPanel({ commissionRate, onRateChange }: { commissionRate: number, onRateChange: (rate: number) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Settings size={22} className="text-slate-500" />
          Platform Settings
        </h3>
      </div>
      <div className="p-6 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-slate-900">Commission Split</h4>
              <p className="text-sm text-slate-500">Adjust the percentage of the delivery fee that goes to the driver.</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <span className="text-xl font-black text-blue-600">{Math.round(commissionRate * 100)}%</span>
              <span className="text-xs font-bold text-blue-400 ml-1">Driver Share</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={commissionRate * 100}
              onChange={(e) => onRateChange(parseInt(e.target.value) / 100)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>0% (Company Only)</span>
              <span>50% (Equal Split)</span>
              <span>100% (Driver Only)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Driver Payout</p>
              <p className="text-2xl font-black text-green-700">{Math.round(commissionRate * 100)}%</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Company Share</p>
              <p className="text-2xl font-black text-blue-700">{Math.round((1 - commissionRate) * 100)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function DriverProfile({ driver, orders, commissionRate, onBack }: { driver: Driver, orders: Order[], commissionRate: number, onBack: () => void }) {
  const driverOrders = orders.filter(o => o.assignedDriverId === driver.id);
  const completedOrders = driverOrders.filter(o => o.status === 'delivered');
  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.deliveryPrice, 0) * commissionRate;
  const avgDeliveryPrice = completedOrders.length > 0 
    ? (completedOrders.reduce((sum, o) => sum + o.deliveryPrice, 0) / completedOrders.length) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
              driver.isAvailable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {driver.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{driver.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Driver ID: {driver.id}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${driver.isAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                  {driver.isAvailable ? 'Available' : 'On Delivery'}
                </span>
                {driver.rating && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={12} className="fill-amber-500" />
                      <span className="text-xs font-bold">{(driver.rating || 0).toFixed(1)} ({driver.totalRatings})</span>
                    </div>
                  </>
                )}
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  driver.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {driver.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Location</p>
            <p className="text-xs font-medium text-slate-600">{(driver.location?.lat || 0).toFixed(4)}, {(driver.location?.lng || 0).toFixed(4)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={driverOrders.length} icon={<Package className="text-blue-600" />} />
        <StatCard label="Completed" value={completedOrders.length} icon={<CheckCircle2 className="text-green-600" />} />
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-slate-50 rounded-lg"><span className="text-green-600 font-bold text-xs">ETB</span></div>
            <span className="text-2xl font-bold text-green-600">{(totalEarnings || 0).toFixed(2)} ETB</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Net Earnings</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-slate-50 rounded-lg"><TrendingUp className="text-indigo-600" size={20} /></div>
            <span className="text-2xl font-bold">{(avgDeliveryPrice || 0).toFixed(2)} ETB</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg. Order Price</p>
        </div>
      </div>

      {driver.registrationData && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-blue-600" />
            Registration Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">National ID</p>
              <p className="text-sm font-semibold text-slate-700">{driver.registrationData.nationalId}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Phone</p>
              <p className="text-sm font-semibold text-slate-700">+251 {driver.registrationData.phoneNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${driver.registrationData.depositConfirmed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <CheckCircle size={14} />
              </div>
              <p className="text-xs font-medium text-slate-600">Deposit Confirmed</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${driver.registrationData.visitConfirmed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <CheckCircle size={14} />
              </div>
              <p className="text-xs font-medium text-slate-600">In-Person Visit Confirmed</p>
            </div>
            {driver.registrationData.idPhoto && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID Photo</p>
                <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:scale-110 transition-transform" onClick={() => window.open(driver.registrationData?.idPhoto)}>
                  <img src={driver.registrationData.idPhoto} alt="ID" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            Driver Order History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Restaurant</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {driverOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No orders found for this driver
                  </td>
                </tr>
              ) : (
                driverOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{order.id}</td>
                    <td className="px-6 py-4 text-sm font-medium">{order.restaurantName}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      {(order.deliveryPrice || 0).toFixed(2)} ETB
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const configs: Record<OrderStatus, { label: string, classes: string }> = {
    pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
    assigned: { label: 'Assigned', classes: 'bg-blue-100 text-blue-700' },
    picked_up: { label: 'Picked Up', classes: 'bg-indigo-100 text-indigo-700' },
    on_the_way: { label: 'On The Way', classes: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Delivered', classes: 'bg-green-100 text-green-700' },
    expired: { label: 'Expired', classes: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Cancelled', classes: 'bg-slate-100 text-slate-700' },
  };

  const config = configs[status];
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.classes}`}>
      {config.label}
    </span>
  );
}

function RolesView() {
  const [users, setUsers] = useState<UserSession[]>([
    { uid: 'admin-local', email: 'admin@delivery.com', role: 'super_admin', createdAt: Date.now() }
  ]);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('dispatcher');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // Mock user creation
      const newUser: UserSession = {
        uid: 'user-' + Math.random().toString(36).substr(2, 9),
        email: newEmail,
        role: newRole,
        createdAt: Date.now()
      };
      
      setUsers(prev => [...prev, newUser]);
      
      setNewEmail('');
      setNewPassword('');
      alert('User created successfully (Local State)!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create user.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-teal-600/10 p-2 rounded-lg">
            <ShieldCheck size={20} className="text-teal-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">User & Role Management</h3>
            <p className="text-xs text-slate-500">Create and manage platform access roles</p>
          </div>
        </div>

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Role</label>
            <select 
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="dispatcher">Dispatcher</option>
              <option value="sub_admin">Sub Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <UserPlus size={18} />}
            Create User
          </button>
        </form>
        {error && <p className="text-red-500 text-xs mt-3 font-medium">{error}</p>}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Active Platform Users</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Identity</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Access Level</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Registration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-600/10 flex items-center justify-center text-teal-600 font-black text-xs">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.email}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{u.uid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      u.role === 'super_admin' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'System User'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
