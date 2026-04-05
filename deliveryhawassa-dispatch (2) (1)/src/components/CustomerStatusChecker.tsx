import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Package, MapPin, Clock, CheckCircle2, Truck, AlertCircle, Star } from 'lucide-react';
import { Order, Driver } from '../types';

interface CustomerStatusCheckerProps {
  orders: Order[];
  drivers: Driver[];
  orderId: string;
  onOrderIdChange: (id: string) => void;
  onRateDriver: (orderId: string, rating: number) => void;
}

export default function CustomerStatusChecker({ orders, drivers, orderId, onOrderIdChange, onRateDriver }: CustomerStatusCheckerProps) {
  const [searchId, setSearchId] = useState(orderId);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittedRating, setSubmittedRating] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find(o => o.id.toLowerCase() === searchId.toLowerCase());
    if (order) {
      setFoundOrder(order);
      setError(null);
      onOrderIdChange(searchId);
      setSubmittedRating(!!order.rating);
      if (order.rating) setRating(order.rating);
    } else {
      setFoundOrder(null);
      setError('Order not found. Please check the ID and try again.');
    }
  };

  const handleRate = (val: number) => {
    if (submittedRating || !foundOrder) return;
    setRating(val);
    onRateDriver(foundOrder.id, val);
    setSubmittedRating(true);
  };

  const getStatusStep = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 1;
      case 'assigned': return 2;
      case 'picked_up': return 3;
      case 'on_the_way': return 4;
      case 'delivered': return 5;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStep = foundOrder ? getStatusStep(foundOrder.status) : 0;
  const assignedDriver = foundOrder?.assignedDriverId ? drivers.find(d => d.id === foundOrder.assignedDriverId) : null;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Track Your Order</h2>
        <p className="text-slate-500 font-medium">Enter your order ID to see real-time updates</p>
      </div>

      <form onSubmit={handleSearch} className="mb-10">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Enter Order ID (e.g., ORD-123)"
            className="w-full pl-12 pr-32 py-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
          >
            Track
          </button>
        </div>
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-red-500 text-sm font-bold flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {error}
          </motion.p>
        )}
      </form>

      {foundOrder && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Order ID</p>
                <h3 className="text-xl font-black">{foundOrder.id}</h3>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                foundOrder.status === 'delivered' ? 'bg-green-500' :
                foundOrder.status === 'cancelled' ? 'bg-red-500' :
                'bg-blue-500'
              }`}>
                {foundOrder.status.replace('_', ' ')}
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Package size={16} />
              <span className="text-sm font-bold">{foundOrder.restaurantName}</span>
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="p-8">
            <div className="relative flex justify-between mb-12">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-10" />
              <motion.div 
                className="absolute top-5 left-0 h-1 bg-blue-600 -z-10"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, (currentStep - 1) * 25)}%` }}
              />

              {[
                { step: 1, icon: <Package size={20} />, label: 'Confirmed' },
                { step: 2, icon: <CheckCircle2 size={20} />, label: 'Assigned' },
                { step: 3, icon: <Package size={20} />, label: 'Picked Up' },
                { step: 4, icon: <Truck size={20} />, label: 'On the Way' },
                { step: 5, icon: <MapPin size={20} />, label: 'Delivered' }
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    currentStep >= item.step 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                      : 'bg-white text-slate-300 border-2 border-slate-100'
                  }`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    currentStep >= item.step ? 'text-blue-600' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Estimated Arrival</span>
                </div>
                <p className="text-lg font-black text-slate-900">
                  {foundOrder.status === 'delivered' ? 'Delivered' : 
                   foundOrder.estimatedArrivalAt ? new Date(foundOrder.estimatedArrivalAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                   'Calculating...'}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <MapPin size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Delivery To</span>
                </div>
                <p className="text-lg font-black text-slate-900 truncate">{foundOrder.deliveryLocation}</p>
              </div>
            </div>

            {/* Driver Info */}
            {assignedDriver && foundOrder.status !== 'delivered' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">
                  {assignedDriver.name[0]}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Your Courier</p>
                  <p className="text-lg font-black text-slate-900">{assignedDriver.name}</p>
                  <p className="text-xs font-bold text-slate-500">{assignedDriver.phone}</p>
                </div>
                <div className="ml-auto bg-white px-3 py-1 rounded-full text-[10px] font-black text-blue-600 border border-blue-100">
                  ACTIVE
                </div>
              </motion.div>
            )}

            {/* Rating Section */}
            {foundOrder.status === 'delivered' && (
              <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                <h4 className="text-lg font-black text-slate-900 mb-2">Rate Your Courier</h4>
                <p className="text-slate-500 text-sm mb-4">How was your delivery experience with {assignedDriver?.name}?</p>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => !submittedRating && setHoverRating(star)}
                      onMouseLeave={() => !submittedRating && setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className={`transition-all ${submittedRating ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                    >
                      <Star
                        size={32}
                        className={`${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {submittedRating && (
                  <p className="text-green-600 font-bold text-sm">Thank you for your feedback!</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
