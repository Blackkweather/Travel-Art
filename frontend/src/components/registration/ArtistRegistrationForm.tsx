import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/utils/api';
import SimpleNavbar from '../SimpleNavbar';
import Footer from '../Footer';
import StepIndicator from './StepIndicator';
import Step1RoleSelection from './Step1RoleSelection';
import Step2BasicInfo from './Step2BasicInfo';
import Step3RoleDetails from './Step3RoleDetails';

interface RegistrationState {
  step: number;
  role: 'ARTIST' | 'HOTEL';
  fullName: string;
  email: string;
  phone: string;
  country: string;
  password: string;
  confirmPassword: string;
}

const INITIAL_STATE: RegistrationState = {
  step: 1,
  role: 'ARTIST',
  fullName: '',
  email: '',
  phone: '',
  country: '',
  password: '',
  confirmPassword: ''
};

const ArtistRegistrationForm: React.FC = () => {
  const [state, setState] = useState<RegistrationState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();

  const stepTitles = ['Choose Role', 'Basic Info', 'Details'];

  const handleRoleChange = useCallback((role: 'ARTIST' | 'HOTEL') => {
    setState(prev => ({ ...prev, role }));
  }, []);

  const handleBasicInfoChange = useCallback((fullName: string, email: string) => {
    setState(prev => ({ ...prev, fullName, email }));
  }, []);

  const handleDetailsChange = useCallback((data: {
    phone: string;
    country: string;
    password: string;
    confirmPassword: string;
    additionalData?: Record<string, any>;
  }) => {
    setState(prev => ({
      ...prev,
      phone: data.phone,
      country: data.country,
      password: data.password,
      confirmPassword: data.confirmPassword
    }));
  }, []);

  const handleNextStep = () => {
    if (state.step < 3) {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: prev.step - 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Use local registration
      const nameParts = state.fullName.split(' ');
      const firstName = nameParts[0] || state.fullName;
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await registerUser({
        email: state.email,
        password: state.password,
        firstName,
        lastName,
        phone: state.phone,
        country: state.country,
        role: state.role,
        ...(state.role === 'ARTIST' && { stageName: state.fullName })
      });
      
      toast.success('Registration successful! Welcome to Travel Art');
      
      // Redirect based on role
      const redirectPath = state.role === 'ARTIST' ? '/dashboard' : '/dashboard';
      navigate(redirectPath);
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SimpleNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        {/* Step Indicator */}
        <div className="max-w-2xl mx-auto mb-12">
          <StepIndicator currentStep={state.step} totalSteps={3} steps={stepTitles} />
        </div>

        {/* Form Container */}
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Role Selection */}
            {state.step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step1RoleSelection
                  role={state.role}
                  onChange={handleRoleChange}
                  onNext={handleNextStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {/* Step 2: Basic Info */}
            {state.step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step2BasicInfo
                  fullName={state.fullName}
                  email={state.email}
                  onChange={handleBasicInfoChange}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {/* Step 3: Role Details */}
            {state.step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step3RoleDetails
                  role={state.role}
                  phone={state.phone}
                  country={state.country}
                  password={state.password}
                  confirmPassword={state.confirmPassword}
                  onChange={handleDetailsChange}
                  onBack={handlePreviousStep}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArtistRegistrationForm;
