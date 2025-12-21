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
import Step4MediaRequirements from './Step4MediaRequirements';
import Step1RoleSelection from './Step1RoleSelection';
import { artistsApi } from '@/utils/api';
import {
  ArtistRegistrationData,
  BasicInfo,
  ArtisticCategory,
  SubcategoryInfo,
  MediaRequirements
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
  subcategory: {
    categoryType: '',
    specificCategory: '',
    domain: ''
  },
  media: {
    profileImageUrl: '',
    travelInstruments: [],
    performanceLinks: [],
    instagram: '',
    facebook: '',
    youtube: ''
  }
};

const ArtistRegistrationFlow: React.FC = () => {
  const [state, setState] = useState<ArtistRegistrationData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const [role, setRole] = useState<'ARTIST' | 'HOTEL'>('ARTIST');

  const stepTitles = [
    'Choisir un rôle',
    'Informations de base',
    'Catégorie artistique',
    'Sous-catégories',
    'Instruments & Liens'
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

  // Update media and requirements
  const handleMediaChange = useCallback((data: MediaRequirements) => {
    setState(prev => ({ ...prev, media: data }));
  }, []);

  // Move to next step
  const handleNextStep = () => {
    if (state.step === 1) {
      if (role === 'HOTEL') {
        navigate('/register?role=hotel');
        return;
      }
    }
    if (state.step < 5) {
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

  // Submit the complete form
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validate all data before submission
      if (!state.basicInfo.stageName || !state.basicInfo.email || !state.basicInfo.password) {
        toast.error('Veuillez compléter tous les champs obligatoires');
        setIsLoading(false);
        return;
      }
      if (!state.media.profileImageUrl) {
        toast.error('La photo de profil est obligatoire');
        setIsLoading(false);
        return;
      }

      await registerUser({
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
        },
        profileImage: state.media.profileImageUrl,
        travelInstruments: state.media.travelInstruments,
        performanceLinks: state.media.performanceLinks,
        socialLinks: {
          instagram: state.media.instagram,
          facebook: state.media.facebook,
          youtube: state.media.youtube
        }
      });

      const profilePayload = {
        bio: `Artiste ${state.artisticCategory.mainCategory} (${state.subcategory.domain}). Instruments: ${state.media.travelInstruments.join(', ') || '—'}.`,
        discipline: state.subcategory.domain || state.artisticCategory.mainCategory || 'Art',
        priceRange: '$$', // Placeholder; can be refined later
        images: JSON.stringify([]),
        videos: JSON.stringify([]),
        mediaUrls: JSON.stringify({
          profileImageUrl: state.media.profileImageUrl,
          travelInstruments: state.media.travelInstruments,
          performanceLinks: state.media.performanceLinks,
          socialLinks: {
            instagram: state.media.instagram,
            facebook: state.media.facebook,
            youtube: state.media.youtube
          },
          categories: {
            mainCategory: state.artisticCategory.mainCategory,
            secondaryCategory: state.artisticCategory.secondaryCategory,
            audienceType: state.artisticCategory.audienceType,
            languages: state.artisticCategory.languages,
            categoryType: state.subcategory.categoryType,
            specificCategory: state.subcategory.specificCategory,
            domain: state.subcategory.domain
          }
        })
      };
      await artistsApi.createProfile(profilePayload);

      toast.success('Inscription réussie! Bienvenue sur Club Med Live');

      // Redirect to artist dashboard
      navigate('/dashboard/artist');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const errorMessage =
        apiError.response?.data?.error?.message ||
        apiError.message ||
        'Inscription échouée. Veuillez réessayer.';
      toast.error(errorMessage);
      console.error('Registration error:', apiError);
    } finally {
      setIsLoading(false);
    }
  };

  // Progress checks can be derived inline per step when needed

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-beige-50 via-white to-beige-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        {/* Step Indicator */}
        <div className="max-w-3xl mx-auto mb-12">
          <StepIndicator currentStep={state.step} totalSteps={5} steps={stepTitles} />
        </div>

        {/* Form Container */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10">
          <AnimatePresence mode="wait">
            {/* Step 1: Role Selection */}
            {state.step === 1 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step1RoleSelection
                  role={role}
                  onChange={setRole}
                  onNext={handleNextStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {/* Step 2: Basic Information */}
            {state.step === 2 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step1BasicInfo
                  data={state.basicInfo}
                  onChange={handleBasicInfoChange}
                  onNext={handleNextStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {/* Step 3: Artistic Category */}
            {state.step === 3 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
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

            {/* Step 4: Subcategory Selection */}
            {state.step === 4 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step3SubcategorySelection
                  mainCategory={state.artisticCategory.mainCategory}
                  data={state.subcategory}
                  onChange={handleSubcategoryChange}
                  onNext={handleNextStep}
                  onBack={handlePreviousStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}

            {/* Step 5: Media & Requirements */}
            {state.step === 5 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Step4MediaRequirements
                  data={state.media}
                  onChange={handleMediaChange}
                  onNext={handleSubmit}
                  onBack={handlePreviousStep}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
            Besoin d&apos;aide&nbsp;? <a href="/contact" className="text-gold font-semibold hover:underline">Contactez-nous</a>
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ArtistRegistrationFlow;
