import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  UserCheck, 
  Building2, 
  Wallet,
  Camera,
  Upload,
  X
} from 'lucide-react';

interface RegistrationData {
  phoneNumber: string;
  nationalId: string;
  depositConfirmed: boolean;
  visitConfirmed: boolean;
  idPhoto?: string;
}

interface DriverRegistrationFormProps {
  onComplete: (data: RegistrationData) => void;
  driverName: string;
}

export function DriverRegistrationForm({ onComplete, driverName }: DriverRegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<RegistrationData>({
    phoneNumber: '',
    nationalId: '',
    depositConfirmed: false,
    visitConfirmed: false,
    idPhoto: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData | 'idPhotoFile', string>>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, idPhotoFile: 'Only JPG, PNG or WebP images are allowed' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors({ ...errors, idPhotoFile: 'Image size must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setData({ ...data, idPhoto: reader.result as string });
      setErrors({ ...errors, idPhotoFile: undefined });
    };
    reader.readAsDataURL(file);
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof RegistrationData | 'idPhotoFile', string>> = {};
    
    if (step === 1) {
      if (!data.phoneNumber) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!/^\d{9}$/.test(data.phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid 9-digit phone number';
      }
    } else if (step === 2) {
      if (!data.nationalId) {
        newErrors.nationalId = 'National ID is required';
      } else if  (data.nationalId.length < 16) {
        newErrors.nationalId = 'Please enter a valid National ID 16 digit';
      }
    } else if (step === 3) {
      if (!data.idPhoto) {
        newErrors.idPhotoFile = 'Please upload a photo of your National ID';
      }
    } else if (step === 4) {
      if (!data.depositConfirmed) {
        newErrors.depositConfirmed = 'Please confirm the deposit';
      }
      if (!data.visitConfirmed) {
        newErrors.visitConfirmed = 'Please confirm the in-person visit';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        onComplete(data);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-blue-600 p-6 text-white text-center">
        <h2 className="text-xl font-bold">Driver Registration</h2>
        <p className="text-blue-100 text-sm mt-1">Welcome, {driverName}!</p>
        
        {/* Progress Bar */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s <= step ? 'w-8 bg-white' : 'w-4 bg-blue-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contact Information</h3>
                  <p className="text-xs text-gray-500">How can we reach you?</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+251</span>
                  <input
                    type="tel"
                    placeholder="912345678"
                    value={data.phoneNumber}
                    onChange={(e) => setData({ ...data, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="rotate-180" /> {errors.phoneNumber}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400 italic">Example: 911223344</p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Identity Verification</h3>
                  <p className="text-xs text-gray-500">Please provide your National ID</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">National ID Number</label>
                <input
                  type="text"
                  placeholder="Enter ID number"
                  value={data.nationalId}
                  onChange={(e) => setData({ ...data, nationalId: e.target.value })}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.nationalId ? 'border-red-500 bg-red-50' : 'border-gray-200'
                  }`}
                />
                {errors.nationalId && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="rotate-180" /> {errors.nationalId}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">ID Photo Upload</h3>
                  <p className="text-xs text-gray-500">Upload a clear photo of your ID</p>
                </div>
              </div>

              <div className="space-y-4">
                {!data.idPhoto ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="id-photo-upload"
                    />
                    <label
                      htmlFor="id-photo-upload"
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        errors.idPhotoFile ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className={`w-10 h-10 mb-3 ${errors.idPhotoFile ? 'text-red-400' : 'text-gray-400'}`} />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG or WebP (MAX. 5MB)</p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                    <img src={data.idPhoto} alt="ID Preview" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => setData({ ...data, idPhoto: undefined })}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {errors.idPhotoFile && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={12} className="rotate-180" /> {errors.idPhotoFile}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Final Requirements</h3>
                  <p className="text-xs text-gray-500">Confirm you're ready to start</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  data.depositConfirmed ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={data.depositConfirmed}
                    onChange={(e) => setData({ ...data, depositConfirmed: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet size={14} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">Security Deposit</span>
                    </div>
                    <p className="text-xs text-gray-500">I confirm that I have paid the required security deposit of 500 ETB.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                  data.visitConfirmed ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={data.visitConfirmed}
                    onChange={(e) => setData({ ...data, visitConfirmed: e.target.checked })}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 size={14} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">In-Person Visit</span>
                    </div>
                    <p className="text-xs text-gray-500">I confirm that I will visit the office for final verification and training.</p>
                  </div>
                </label>
              </div>

              {(errors.depositConfirmed || errors.visitConfirmed) && (
                <p className="text-xs text-red-500 text-center">Please confirm both requirements to proceed.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-8 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Back
            </button>
          )}
          <button
            onClick={nextStep}
            className="flex-[2] py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            {step === 4 ? 'Complete Registration' : 'Continue'} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
