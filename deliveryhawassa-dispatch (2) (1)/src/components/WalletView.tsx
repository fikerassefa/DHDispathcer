import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, Search, Filter, Plus, CheckCircle2, XCircle, UserCog } from 'lucide-react';
import { Driver } from '../types';

interface Wallet {
  driverId: string;
  balance: number;
  totalEarned: number;
}

interface PayoutRequest {
  id: string;
  driverId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
}

interface WalletViewProps {
  drivers: Driver[];
  wallets: Record<string, Wallet>;
  onApprovePayout: (payoutId: string) => void;
}

export default function WalletView({ drivers, wallets, onApprovePayout }: WalletViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock payout requests for UI demonstration
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([
    { id: 'p1', driverId: 'd1', amount: 1500, status: 'pending', requestedAt: Date.now() - 3600000 },
    { id: 'p2', driverId: 'd2', amount: 2200, status: 'approved', requestedAt: Date.now() - 86400000 },
  ]);

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.phone.includes(searchTerm)
  );

  const totalBalance = Object.values(wallets).reduce((sum, w) => sum + w.balance, 0);
  const totalPayouts = payoutRequests.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
              <WalletIcon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Driver Balance</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalBalance.toLocaleString()} ETB</h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Payouts Processed</p>
              <h3 className="text-2xl font-bold text-slate-900">{totalPayouts.toLocaleString()} ETB</h3>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Requests</p>
              <h3 className="text-2xl font-bold text-slate-900">{payoutRequests.filter(p => p.status === 'pending').length}</h3>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Driver Wallets List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Driver Wallets</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Balance</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Earned</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.map(driver => {
                  const wallet = wallets[driver.id] || { balance: 0, totalEarned: 0 };
                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                            {driver.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{driver.name}</p>
                            <p className="text-xs text-slate-500">{driver.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">{wallet.balance.toLocaleString()} ETB</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {wallet.totalEarned.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-teal-600 hover:text-teal-700 font-semibold text-sm">View Details</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Requests */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Payout Requests</h2>
          <div className="space-y-4">
            {payoutRequests.map(request => {
              const driver = drivers.find(d => d.id === request.driverId);
              return (
                <motion.div 
                  key={request.id}
                  layout
                  className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <UserCog size={20} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{driver?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{new Date(request.requestedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      request.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                      request.status === 'approved' ? 'bg-teal-100 text-teal-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                    <span className="text-sm text-slate-500">Amount Requested</span>
                    <span className="text-lg font-bold text-slate-900">{request.amount.toLocaleString()} ETB</span>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onApprovePayout(request.id)}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                      <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
