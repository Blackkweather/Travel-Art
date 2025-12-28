import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import Header from '../Header';
import Footer from '../Footer';
import StepIndicator from './StepIndicator';
import Step1BasicInfo from './Step1BasicInfo';
import Step2ArtisticCategory from './Step2ArtisticCategory';
import Step3SubcategorySelection from './Step3SubcategorySelection';
import {
  ArtistRegistrationData,
  BasicInfo,
  ArtisticCategory,
  SubcategoryInfo
} from '@/types/artistRegistration';

const INITIAL_STATE: ArtistRegistrationData = {
  step: 1,
  basicInfo: {
    stageName: '',
    birthDate: '',
    lastName: '',
    firstName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    agreeToTerms: false
  },
  artisticCategory: {
    mainCategory: '',
    secondaryCategory: undefined,
    audienceType: [],
    languages: []
  },
  media: {
    profileImageUrl: '',
    travelInstruments: [],
    performanceLinks: []
  },
  subcategory: {
    categoryType: '',
    specificCategory: '',
    domain: ''
  }
};

const ArtistRegistrationFlow: React.FC = () => {
  const [state, setState] = useState<ArtistRegistrationData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();

  const stepTitles = [
    'Informations de base',
    'Catégorie artistique',
    'Sous-catégories'
  ];

  // Update basic info
  const handleBasicInfoChange = useCallback((data: BasicInfo) => {
    setState(prev => ({ ...prev, basicInfo: data }));
  }, []);

  // Update artistic category
  const handleArtisticCategoryChange = useCallback((data: ArtisticCategory) => {
    setState(prev => ({ ...prev, artisticCategory: data }));
  }, []);

  // Update subcategory
  const handleSubcategoryChange = useCallback((data: SubcategoryInfo) => {
    setState(prev => ({ ...prev, subcategory: data }));
  }, []);

  // Move to next step
  const handleNextStep = () => {
    if (state.step < 3) {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Move to previous step
  const handlePreviousStep = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: prev.step - 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Get auth store
  const { register: registerAuth } = useAuthStore();

  // Submit the complete form
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validate all data before submission
      if (!state.basicInfo.stageName || !state.basicInfo.email || !state.basicInfo.password) {
        toast.error('Please complete all required fields');
        setIsLoading(false);
        return;
      }

      const registrationData = {
        name: state.basicInfo.firstName + ' ' + state.basicInfo.lastName,
        stageName: state.basicInfo.stageName,
        email: state.basicInfo.email,
        phone: state.basicInfo.phone,
        country: state.basicInfo.country,
        birthDate: state.basicInfo.birthDate,
        password: state.basicInfo.password,
        role: 'ARTIST' as const,
        artisticProfile: {
          mainCategory: state.artisticCategory.mainCategory,
          secondaryCategory: state.artisticCategory.secondaryCategory,
          audienceType: state.artisticCategory.audienceType,
          languages: state.artisticCategory.languages,
          categoryType: state.subcategory.categoryType,
          specificCategory: state.subcategory.specificCategory,
          domain: state.subcategory.domain
        }
      };

      // Register user and automatically log them in
      console.log('🚀 Starting registration...', { email: registrationData.email });
      await registerAuth(registrationData);
      console.log('✅ Registration completed!');

      // Check auth state
      const authState = useAuthStore.getState();
      console.log('🔍 Auth state after registration:', {
        isAuthenticated: authState.isAuthenticated,
        hasToken: !!authState.token,
        hasUser: !!authState.user
      });

      toast.success('Inscription réussie! Bienvenue sur Travel Arts');

      // Small delay to ensure state is updated
      setTimeout(() => {
        console.log('🔄 Redirecting to profile...');
        // Redirect to profile page for artists to complete their setup
        navigate('/dashboard/profile');
      }, 500);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        'Inscription échouée. Veuillez réessayer.';
      toast.error(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can proceed from step 1
  const canProceedFromStep1 = state.basicInfo.stageName &&
    state.basicInfo.firstName &&
    state.basicInfo.lastName &&
    state.basicInfo.email &&
    state.basicInfo.password &&
    state.basicInfo.country;

  // Check if user can proceed from step 2
  const canProceedFromStep2 = state.artisticCategory.mainCategory &&
    state.artisticCategory.audienceType.length > 0 &&
    state.artisticCategory.languages.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-cream via-white to-cream">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {/* Step Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <StepIndicator currentStep={state.step} totalSteps={3} steps={stepTitles} />
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Information */}
            {state.step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <Step1BasicInfo
                  data={state.basicInfo}
                  onChange={handleBasicInfoChange}
                  onNext={handleNextStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {/* Step 2: Artistic Category */}
            {state.step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <Step2ArtisticCategory
                  data={state.artisticCategory}
                  onChange={handleArtisticCategoryChange}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {/* Step 3: Subcategory Selection */}
            {state.step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                transition={{ 
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                <Step3SubcategorySelection
                  mainCategory={state.artisticCategory.mainCategory}
                  data={state.subcategory}
                  onChange={handleSubcategoryChange}
                  onNext={handleSubmit}
                  onBack={handlePreviousStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Form Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mt-8 text-center"
        >
          <p className="text-sm text-gray-600">
            Vos informations sont sécurisées et ne seront jamais partagées.
            <br />
            Avez besoin d'aide? <a href="/contact" className="text-gold font-semibold hover:underline">Contactez-nous</a>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ArtistRegistrationFlow;
