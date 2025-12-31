import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SimpleNavbar from '../SimpleNavbar';
import Footer from '../Footer';
import StepIndicator from './StepIndicator';
import FormField from '../FormField';
import SelectWithSearch from './SelectWithSearch';
import CheckboxGroup from './CheckboxGroup';
import RadioGroup from './RadioGroup';
import { useAuthStore } from '@/store/authStore';
import { COUNTRIES } from '@/types/artistRegistration';
import { hotelsApi } from '@/utils/api';

type PublicType = 'Familles' | 'Couples' | 'Adult only' | 'Corporate';
type Ambiance = 'Chill / Lounge' | 'Festif' | 'Culturel' | 'Premium / luxe';
type EventType = 'Live music' | 'DJ sets' | 'Shows' | 'Ateliers / performances artistiques';

interface Space {
  name: string;
  locationType: 'Intérieur' | 'Extérieur';
  capacity: string;
  hours: string;
  noiseLevel: string;
  media: string[];
}

interface Equipment {
  stage: { has: boolean; dimensions?: string };
  sound: { has: boolean; details?: string };
  lighting: 'Basique' | 'Pro' | '';
  screens: { has: boolean };
  crew: { has: boolean };
}

interface Collaboration {
  types: Array<'Hébergement + restauration' | 'Visibilité / promotion'>;
  conditionsText?: string;
  durationType: 'One shot' | 'Résidence' | '';
  residenceDuration?: string;
  openDates?: string;
}

interface Logistics {
  lodging: boolean;
  meals: boolean;
  transport: boolean;
  facilities?: string;
}

interface Freedom {
  level: 'Totale' | 'Encadrée' | '';
  expectations: Array<'Interaction avec les clients' | 'Image de marque à respecter'>;
  possibilities: Array<'Concepts originaux' | 'Collaborations avec d’autres artistes' | 'Workshops / expériences uniques'>;
  otherEnabled?: boolean;
  otherDetails?: string;
  artistTypesNeeded?: string;
  frequency?: { perWeek?: string; perMonth?: string };
  flowDescription?: string;
}

interface ValidationProcess {
  delay?: string;
  process: 'Validation simple' | 'Validation après échange' | '';
  decisionMaker?: string;
}

interface HotelGeneral {
  name: string;
  country: string;
  city: string;
  location?: string;
  hotelType: 'Resort / Club' | 'Hôtel urbain' | 'Hôtel de luxe' | 'Hôtel familial' | 'Business' | '';
  roomCount: string;
  publicPrimary: PublicType[];
  website?: string;
  socials?: { instagram?: string; facebook?: string; youtube?: string };
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface HotelRegistrationData {
  step: number;
  general: HotelGeneral;
  ambiance: { styles: Ambiance[]; eventTypes: EventType[]; appreciated?: string; disliked?: string };
  spaces: Space[];
  equipment: Equipment;
  collaboration: Collaboration;
  logistics: Logistics;
  freedom: Freedom;
  validation: ValidationProcess;
}

const INITIAL_STATE: HotelRegistrationData = {
  step: 1,
  general: {
    name: '',
    country: '',
    city: '',
    location: '',
    hotelType: '',
    roomCount: '',
    publicPrimary: [],
    website: '',
    socials: { instagram: '', facebook: '', youtube: '' },
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  },
  ambiance: {
    styles: [],
    eventTypes: [],
    appreciated: '',
    disliked: ''
  },
  spaces: [],
  equipment: {
    stage: { has: false, dimensions: '' },
    sound: { has: false, details: '' },
    lighting: '',
    screens: { has: false },
    crew: { has: false }
  },
  collaboration: {
    types: [],
    durationType: '',
    residenceDuration: '',
    openDates: ''
  },
  logistics: {
    lodging: false,
    meals: false,
    transport: false,
    facilities: ''
  },
  freedom: {
    level: '',
    expectations: [],
    possibilities: [],
    otherEnabled: false,
    otherDetails: '',
    artistTypesNeeded: '',
    frequency: { perWeek: '', perMonth: '' },
    flowDescription: ''
  },
  validation: {
    delay: '',
    process: '',
    decisionMaker: ''
  }
};

const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const HotelRegistrationFlow: React.FC = () => {
  const [state, setState] = useState<HotelRegistrationData>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();

  const stepTitles = [
    'Infos générales',
    'Ambiance & identité',
    "Espace d’expression & équipement technique",
    'Conditions de collaboration',
    'Logistique',
    'Liberté artistique',
    'Validation & process'
  ];

  const countryOptions = useMemo(() => COUNTRIES.map(c => ({ value: c, label: c })), []);

  const updateGeneral = useCallback((patch: Partial<HotelGeneral>) => {
    setState(prev => ({ ...prev, general: { ...prev.general, ...patch } }));
  }, []);

  const updateAmbiance = useCallback((patch: Partial<HotelRegistrationData['ambiance']>) => {
    setState(prev => ({ ...prev, ambiance: { ...prev.ambiance, ...patch } }));
  }, []);

  const updateEquipment = useCallback((patch: Partial<Equipment>) => {
    setState(prev => ({ ...prev, equipment: { ...prev.equipment, ...patch } }));
  }, []);

  const updateCollab = useCallback((patch: Partial<Collaboration>) => {
    setState(prev => ({ ...prev, collaboration: { ...prev.collaboration, ...patch } }));
  }, []);

  const updateLogistics = useCallback((patch: Partial<Logistics>) => {
    setState(prev => ({ ...prev, logistics: { ...prev.logistics, ...patch } }));
  }, []);

  const updateFreedom = useCallback((patch: Partial<Freedom>) => {
    setState(prev => ({ ...prev, freedom: { ...prev.freedom, ...patch } }));
  }, []);

  const updateValidation = useCallback((patch: Partial<ValidationProcess>) => {
    setState(prev => ({ ...prev, validation: { ...prev.validation, ...patch } }));
  }, []);

  const addSpace = () => {
    setState(prev => ({
      ...prev,
      spaces: [...prev.spaces, { name: '', locationType: 'Intérieur', capacity: '', hours: '', noiseLevel: '', media: [] }]
    }));
  };

  const updateSpace = (index: number, patch: Partial<Space>) => {
    setState(prev => {
      const spaces = [...prev.spaces];
      spaces[index] = { ...spaces[index], ...patch };
      return { ...prev, spaces };
    });
  };

  const removeSpace = (index: number) => {
    setState(prev => {
      const spaces = prev.spaces.filter((_, i) => i !== index);
      return { ...prev, spaces };
    });
  };

  const nextStep = () => {
    if (state.step < 7) {
      setState(prev => ({ ...prev, step: prev.step + 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: prev.step - 1 }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!state.general.name || !state.general.country || !state.general.city || !state.general.hotelType || !state.general.roomCount) {
        toast.error('Veuillez compléter les informations obligatoires');
        setIsLoading(false);
        return;
      }

      await registerUser({
        role: 'HOTEL',
        name: state.general.name,
        email: state.general.contactEmail || '',
        password: 'Temp@12345',
        phone: state.general.contactPhone || '',
        country: state.general.country
      });

      const locationPayload = JSON.stringify({
        city: state.general.city,
        country: state.general.country
      });
      const performanceSpotsPayload = JSON.stringify(
        state.spaces.map(s => ({
          name: s.name,
          locationType: s.locationType,
          capacity: s.capacity,
          hours: s.hours,
          noiseLevel: s.noiseLevel,
          media: s.media
        }))
      );
      const descriptionText =
        `Type: ${state.general.hotelType}. ` +
        `Ambiance: ${(state.ambiance.styles || []).join(', ') || '—'}. ` +
        `Événements: ${(state.ambiance.eventTypes || []).join(', ') || '—'}. ` +
        `Appréciés: ${state.ambiance.appreciated || '—'}. ` +
        `Refusés: ${state.ambiance.disliked || '—'}. ` +
        `Collab: ${(state.collaboration.types || []).join(', ') || '—'}; ` +
        `Conditions: ${state.collaboration.conditionsText || '—'}; ` +
        `Durée: ${state.collaboration.durationType || '—'} ${state.collaboration.residenceDuration || ''}; ` +
        `Dates: ${state.collaboration.openDates || '—'}. ` +
        `Logistique (hébergement:${state.logistics.lodging ? 'oui' : 'non'}, repas:${state.logistics.meals ? 'oui' : 'non'}, transport:${state.logistics.transport ? 'oui' : 'non'}). ` +
        `Liberté: ${state.freedom.level || '—'}; Attentes: ${(state.freedom.expectations || []).join(', ') || '—'}; ` +
        `Possibilités: ${(state.freedom.possibilities || []).join(', ') || '—'}; ` +
        `Types recherchés: ${state.freedom.artistTypesNeeded || '—'}; ` +
        `Fréquence: ${state.freedom.frequency?.perWeek || '—'}/semaine, ${state.freedom.frequency?.perMonth || '—'}/mois; ` +
        `Autre: ${state.freedom.otherEnabled ? (state.freedom.otherDetails || '—') : '—'}. ` +
        `Validation: délai ${state.validation.delay || '—'}, process ${state.validation.process || '—'}, décisionnaire ${state.validation.decisionMaker || '—'}.`;
      const descriptionPayload = descriptionText.length < 10 ? `${descriptionText} Infos.` : descriptionText;

      await hotelsApi.createProfile({
        name: state.general.name,
        description: descriptionPayload,
        location: locationPayload,
        contactPhone: state.general.contactPhone || '',
        images: JSON.stringify([]),
        performanceSpots: performanceSpotsPayload,
        rooms: JSON.stringify([]),
        repName: state.general.contactName || ''
      });

      toast.success('Inscription hôtel réussie! Welcome to Travel Art.');
      // Redirect to profile page for hotels to view/edit their profile
      navigate('/dashboard/profile');
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(apiError.response?.data?.error?.message || 'Échec de l’inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-cream via-white to-cream">
      <SimpleNavbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto mb-12"
        >
          <StepIndicator currentStep={state.step} totalSteps={7} steps={stepTitles} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-gray-100"
        >
          <AnimatePresence mode="wait">
            {state.step === 1 && (
              <motion.div 
                key="hotel-step1" 
                initial={{ opacity: 0, x: -30, scale: 0.95 }} 
                animate={{ opacity: 1, x: 0, scale: 1 }} 
                exit={{ opacity: 0, x: 30, scale: 0.95 }} 
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Informations générales sur l’hôtel</h2>
                    <p className="text-gray-600">Ces informations permettent à l’artiste de comprendre le standing et l’ambiance.</p>
                  </div>
                  <motion.div variants={itemVariants}>
                    <FormField label="Nom de l’hôtel" value={state.general.name} onChange={(e) => updateGeneral({ name: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={itemVariants}>
                      <SelectWithSearch label="Pays" options={countryOptions} value={state.general.country} onChange={(v) => updateGeneral({ country: v })} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <FormField label="Ville" value={state.general.city} onChange={(e) => updateGeneral({ city: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                    </motion.div>
                  </div>
                  <motion.div variants={itemVariants}>
                    <FormField label="Localisation" placeholder="Adresse ou description" value={state.general.location || ''} onChange={(e) => updateGeneral({ location: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div variants={itemVariants}>
                      <SelectWithSearch
                        label="Type d’hôtel"
                        options={[
                          { value: 'Resort / Club', label: 'Resort / Club' },
                          { value: 'Hôtel urbain', label: 'Hôtel urbain' },
                          { value: 'Hôtel de luxe', label: 'Hôtel de luxe' },
                          { value: 'Hôtel familial', label: 'Hôtel familial' },
                          { value: 'Business', label: 'Business' }
                        ]}
                        value={state.general.hotelType}
                        onChange={(v) => updateGeneral({ hotelType: v as HotelGeneral['hotelType'] })}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <FormField label="Nombre de chambres" placeholder="Ex: 150" value={state.general.roomCount} onChange={(e) => updateGeneral({ roomCount: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                    </motion.div>
                  </div>
                  <motion.div variants={itemVariants}>
                    <CheckboxGroup
                      name="general-public-primary"
                      label="Public principal"
                      options={[
                        { value: 'Familles', label: 'Familles' },
                        { value: 'Couples', label: 'Couples' },
                        { value: 'Adult only', label: 'Adult only' },
                        { value: 'Corporate', label: 'Corporate / événements' }
                      ]}
                      values={state.general.publicPrimary}
                      onChange={(vals) => updateGeneral({ publicPrimary: vals as PublicType[] })}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <FormField label="Site web" placeholder="https://..." value={state.general.website || ''} onChange={(e) => updateGeneral({ website: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Instagram" placeholder="https://instagram.com/..." value={state.general.socials?.instagram || ''} onChange={(e) => updateGeneral({ socials: { ...(state.general.socials || {}), instagram: (e.target as HTMLInputElement).value } })} disabled={isLoading} />
                    <FormField label="Facebook" placeholder="https://facebook.com/..." value={state.general.socials?.facebook || ''} onChange={(e) => updateGeneral({ socials: { ...(state.general.socials || {}), facebook: (e.target as HTMLInputElement).value } })} disabled={isLoading} />
                    <FormField label="YouTube" placeholder="https://youtube.com/..." value={state.general.socials?.youtube || ''} onChange={(e) => updateGeneral({ socials: { ...(state.general.socials || {}), youtube: (e.target as HTMLInputElement).value } })} disabled={isLoading} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Contact responsable" placeholder="Nom" value={state.general.contactName || ''} onChange={(e) => updateGeneral({ contactName: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                    <FormField label="Email contact" placeholder="email@hotel.com" value={state.general.contactEmail || ''} onChange={(e) => updateGeneral({ contactEmail: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                    <FormField label="Téléphone contact" placeholder="+33 ..." value={state.general.contactPhone || ''} onChange={(e) => updateGeneral({ contactPhone: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  </div>
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={nextStep} className="btn-primary w-full md:w-auto">Continuer</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {state.step === 2 && (
              <motion.div 
                key="hotel-step2" 
                initial={{ opacity: 0, x: -30, scale: 0.95 }} 
                animate={{ opacity: 1, x: 0, scale: 1 }} 
                exit={{ opacity: 0, x: 30, scale: 0.95 }} 
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Ambiance & identité artistique</h2>
                    <p className="text-gray-600">Aidez l’artiste à comprendre ce qui colle ou non.</p>
                  </div>
                  <motion.div variants={itemVariants}>
                    <CheckboxGroup
                      name="ambiance-styles"
                      label="Style / ambiance recherchée"
                      options={[
                        { value: 'Chill / Lounge', label: 'Chill / Lounge' },
                        { value: 'Festif', label: 'Festif' },
                        { value: 'Culturel', label: 'Culturel' },
                        { value: 'Premium / luxe', label: 'Premium / luxe' }
                      ]}
                      values={state.ambiance.styles}
                      onChange={(vals) => updateAmbiance({ styles: vals as Ambiance[] })}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CheckboxGroup
                      name="ambiance-event-types"
                      label="Types d’événements habituels"
                      options={[
                        { value: 'Live music', label: 'Live music' },
                        { value: 'DJ sets', label: 'DJ sets' },
                        { value: 'Shows', label: 'Shows' },
                        { value: 'Ateliers / performances artistiques', label: 'Ateliers / performances artistiques' }
                      ]}
                      values={state.ambiance.eventTypes}
                      onChange={(vals) => updateAmbiance({ eventTypes: vals as EventType[] })}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <FormField label="Musiques / arts appréciés" placeholder="Jazz, afro, pop, électro, classique, danse, théâtre, etc." value={state.ambiance.appreciated || ''} onChange={(e) => updateAmbiance({ appreciated: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <FormField label="Ce que l’hôtel ne veut pas" placeholder="Précisez les styles ou formats non souhaités" value={state.ambiance.disliked || ''} onChange={(e) => updateAmbiance({ disliked: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  </motion.div>
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={prevStep} className="btn-secondary">Retour</button>
                    <button type="button" onClick={nextStep} className="btn-primary">Continuer</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {state.step === 3 && (
              <motion.div 
                key="hotel-step3" 
                initial={{ opacity: 0, x: -30, scale: 0.95 }} 
                animate={{ opacity: 1, x: 0, scale: 1 }} 
                exit={{ opacity: 0, x: 30, scale: 0.95 }} 
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Espace d’expression & équipement technique</h2>
                    <p className="text-gray-600">Décrivez les espaces d’expression et les équipements mis à disposition.</p>
                  </div>
                  <div className="space-y-6">
                    {state.spaces.map((space, index) => (
                      <div key={index} className="p-4 border rounded-xl space-y-4">
                        <FormField label="Nom de l’espace" placeholder="Scène, plage, rooftop, salle, piscine…" value={space.name} onChange={(e) => updateSpace(index, { name: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                        <RadioGroup
                          name={`space-${index}-location-type`}
                          label="Intérieur / extérieur"
                          options={[
                            { value: 'Intérieur', label: 'Intérieur' },
                            { value: 'Extérieur', label: 'Extérieur' }
                          ]}
                          value={space.locationType}
                          onChange={(v) => updateSpace(index, { locationType: v as Space['locationType'] })}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField label="Capacité" placeholder="Nombre de personnes" value={space.capacity} onChange={(e) => updateSpace(index, { capacity: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                          <FormField label="Horaires possibles" placeholder="Ex: 18h-22h" value={space.hours} onChange={(e) => updateSpace(index, { hours: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                          <FormField label="Niveau sonore autorisé" placeholder="Bas, moyen, élevé" value={space.noiseLevel} onChange={(e) => updateSpace(index, { noiseLevel: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                        </div>
                        <FormField label="Photos ou vidéos (URLs, séparées par des virgules)" placeholder="https://..., https://..." value={(space.media || []).join(', ')} onChange={(e) => updateSpace(index, { media: (e.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean) })} disabled={isLoading} />
                        <div className="flex justify-between">
                          <button type="button" onClick={() => removeSpace(index)} className="btn-secondary">Supprimer</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={addSpace} className="btn-outline">Ajouter un espace</button>
                  </div>
                  <div className="space-y-4 pt-2">
                    <RadioGroup
                      name="equipment-stage"
                      label="Scène"
                      options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]}
                      value={state.equipment.stage.has ? 'true' : 'false'}
                      onChange={(v) => updateEquipment({ stage: { ...state.equipment.stage, has: v === 'true' } })}
                    />
                    <FormField label="Dimensions de la scène" placeholder="Ex: 6m x 4m" value={state.equipment.stage.dimensions || ''} onChange={(e) => updateEquipment({ stage: { ...state.equipment.stage, dimensions: (e.target as HTMLInputElement).value } })} disabled={isLoading} />
                    <RadioGroup
                      name="equipment-sound"
                      label="Sonorisation"
                      options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]}
                      value={state.equipment.sound.has ? 'true' : 'false'}
                      onChange={(v) => updateEquipment({ sound: { ...state.equipment.sound, has: v === 'true' } })}
                    />
                    <FormField label="Détails sonorisation" placeholder="Marque, puissance, console, micros…" value={state.equipment.sound.details || ''} onChange={(e) => updateEquipment({ sound: { ...state.equipment.sound, details: (e.target as HTMLInputElement).value } })} disabled={isLoading} />
                    <SelectWithSearch label="Éclairage" options={[{ value: 'Basique', label: 'Basique' }, { value: 'Pro', label: 'Pro' }]} value={state.equipment.lighting} onChange={(v) => updateEquipment({ lighting: v as Equipment['lighting'] })} />
                    <RadioGroup name="equipment-screens" label="Écran / vidéo / LED" options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]} value={state.equipment.screens.has ? 'true' : 'false'} onChange={(v) => updateEquipment({ screens: { has: v === 'true' } })} />
                    <RadioGroup name="equipment-crew" label="Régie technique sur place" options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]} value={state.equipment.crew.has ? 'true' : 'false'} onChange={(v) => updateEquipment({ crew: { has: v === 'true' } })} />
                  </div>
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={prevStep} className="btn-secondary">Retour</button>
                    <button type="button" onClick={nextStep} className="btn-primary">Continuer</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {state.step === 4 && (
              <motion.div 
                key="hotel-step4" 
                initial={{ opacity: 0, x: -30, scale: 0.95 }} 
                animate={{ opacity: 1, x: 0, scale: 1 }} 
                exit={{ opacity: 0, x: 30, scale: 0.95 }} 
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Conditions de collaboration</h2>
                    <p className="text-gray-600">Définissez le cadre et laissez l’artiste proposer librement.</p>
                  </div>
                  <CheckboxGroup
                    name="collab-types"
                    label="Type de collaboration acceptée"
                    options={[
                      { value: 'Hébergement + restauration', label: 'Hébergement + restauration' },
                      { value: 'Visibilité / promotion', label: 'Visibilité / promotion' }
                    ]}
                    values={state.collaboration.types}
                    onChange={(vals) => updateCollab({ types: vals as Collaboration['types'] })}
                  />
                  <FormField label="Conditions pour l’artiste (à remplir)" placeholder="Décrivez les conditions précises pour l’artiste venant" value={state.collaboration.conditionsText || ''} onChange={(e) => updateCollab({ conditionsText: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  <RadioGroup name="collab-duration" label="Durée des prestations" options={[{ value: 'One shot', label: 'One shot' }, { value: 'Résidence', label: 'Résidence' }]} value={state.collaboration.durationType} onChange={(v) => updateCollab({ durationType: v as Collaboration['durationType'] })} />
                  <FormField label="Résidence (durée)" placeholder="1 semaine, 1 mois…" value={state.collaboration.residenceDuration || ''} onChange={(e) => updateCollab({ residenceDuration: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  <FormField label="Dates ou périodes ouvertes" placeholder="Périodes ouvertes" value={state.collaboration.openDates || ''} onChange={(e) => updateCollab({ openDates: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={prevStep} className="btn-secondary">Retour</button>
                    <button type="button" onClick={nextStep} className="btn-primary">Continuer</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {state.step === 5 && (
              <motion.div 
                key="hotel-step5" 
                initial={{ opacity: 0, x: -30, scale: 0.95 }} 
                animate={{ opacity: 1, x: 0, scale: 1 }} 
                exit={{ opacity: 0, x: 30, scale: 0.95 }} 
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Logistique pour l’artiste</h2>
                    <p className="text-gray-600">Précisez les éléments qui aident l’artiste à se projeter.</p>
                  </div>
                  <RadioGroup name="logistics-lodging" label="Hébergement fourni" options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]} value={state.logistics.lodging ? 'true' : 'false'} onChange={(v) => updateLogistics({ lodging: v === 'true' })} />
                  <RadioGroup name="logistics-meals" label="Repas inclus" options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]} value={state.logistics.meals ? 'true' : 'false'} onChange={(v) => updateLogistics({ meals: v === 'true' })} />
                  <RadioGroup name="logistics-transport" label="Transport pris en charge" options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]} value={state.logistics.transport ? 'true' : 'false'} onChange={(v) => updateLogistics({ transport: v === 'true' })} />
                  <FormField label="Accès aux installations de l’hôtel" placeholder="Piscine, gym, spa, etc." value={state.logistics.facilities || ''} onChange={(e) => updateLogistics({ facilities: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={prevStep} className="btn-secondary">Retour</button>
                    <button type="button" onClick={nextStep} className="btn-primary">Continuer</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {state.step === 6 && (
              <motion.div 
                key="hotel-step6" 
                initial={{ opacity: 0, x: -30, scale: 0.95 }} 
                animate={{ opacity: 1, x: 0, scale: 1 }} 
                exit={{ opacity: 0, x: 30, scale: 0.95 }} 
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Liberté artistique & attentes</h2>
                    <p className="text-gray-600">Donnez le cadre pour que l’artiste se sente libre.</p>
                  </div>
                  <RadioGroup name="freedom-level" label="Niveau de liberté artistique" options={[{ value: 'Totale', label: 'Totale' }, { value: 'Encadrée', label: 'Encadrée' }]} value={state.freedom.level} onChange={(v) => updateFreedom({ level: v as Freedom['level'] })} />
                  <CheckboxGroup name="freedom-expectations" label="Attentes spécifiques de l’hôtel" options={[{ value: 'Interaction avec les clients', label: 'Interaction avec les clients' }, { value: 'Image de marque à respecter', label: 'Image de marque à respecter' }]} values={state.freedom.expectations} onChange={(vals) => updateFreedom({ expectations: vals as Freedom['expectations'] })} />
                  <CheckboxGroup name="freedom-possibilities" label="Possibilités de proposer" options={[{ value: 'Concepts originaux', label: 'Concepts originaux' }, { value: 'Collaborations avec d’autres artistes', label: 'Collaborations avec d’autres artistes' }, { value: 'Workshops / expériences uniques', label: 'Workshops / expériences uniques' }]} values={state.freedom.possibilities} onChange={(vals) => updateFreedom({ possibilities: vals as Freedom['possibilities'] })} />
                  <div className="flex items-center gap-3">
                    <button type="button" className="btn-outline" onClick={() => updateFreedom({ otherEnabled: !state.freedom.otherEnabled })}>Autre</button>
                  </div>
                  {state.freedom.otherEnabled && (
                    <FormField label="Autre (précisez)" placeholder="Ajoutez vos attentes ou possibilités spécifiques" value={state.freedom.otherDetails || ''} onChange={(e) => updateFreedom({ otherDetails: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  )}
                  <FormField label="Types d’artistes recherchés" placeholder="Musiciens, DJs, danseurs…" value={state.freedom.artistTypesNeeded || ''} onChange={(e) => updateFreedom({ artistTypesNeeded: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  <FormField label="Comment ça va se passer pour eux" placeholder="Décrivez l’organisation et le déroulé" value={state.freedom.flowDescription || ''} onChange={(e) => updateFreedom({ flowDescription: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Combien par semaine" placeholder="Ex: 2" value={state.freedom.frequency?.perWeek || ''} onChange={(e) => updateFreedom({ frequency: { ...(state.freedom.frequency || {}), perWeek: (e.target as HTMLInputElement).value } })} disabled={isLoading} />
                    <FormField label="Combien par mois" placeholder="Ex: 8" value={state.freedom.frequency?.perMonth || ''} onChange={(e) => updateFreedom({ frequency: { ...(state.freedom.frequency || {}), perMonth: (e.target as HTMLInputElement).value } })} disabled={isLoading} />
                  </div>
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={prevStep} className="btn-secondary">Retour</button>
                    <button type="button" onClick={nextStep} className="btn-primary">Continuer</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {state.step === 7 && (
              <motion.div 
                key="hotel-step7" 
                initial={{ opacity: 0, x: -30, scale: 0.95 }} 
                animate={{ opacity: 1, x: 0, scale: 1 }} 
                exit={{ opacity: 0, x: 30, scale: 0.95 }} 
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-navy-900 mb-2">Validation & process</h2>
                    <p className="text-gray-600">Fluidifiez la plateforme avec un process clair.</p>
                  </div>
                  <FormField label="Délai de réponse moyen" placeholder="Ex: 48h" value={state.validation.delay || ''} onChange={(e) => updateValidation({ delay: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  <RadioGroup name="validation-process" label="Process de validation" options={[{ value: 'Validation simple', label: 'Validation simple' }, { value: 'Validation après échange', label: 'Validation après échange' }]} value={state.validation.process} onChange={(v) => updateValidation({ process: v as ValidationProcess['process'] })} />
                  <FormField label="Personne décisionnaire" placeholder="Nom et rôle" value={state.validation.decisionMaker || ''} onChange={(e) => updateValidation({ decisionMaker: (e.target as HTMLInputElement).value })} disabled={isLoading} />
                  <div className="flex justify-between pt-4">
                    <button type="button" onClick={prevStep} className="btn-secondary">Retour</button>
                    <button type="button" onClick={handleSubmit} className="btn-primary" disabled={isLoading}>{isLoading ? 'Envoi…' : 'Terminer'}</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-3xl mx-auto mt-8 text-center">
          <p className="text-sm text-gray-600">
            Vos informations sont sécurisées et ne seront jamais partagées.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default HotelRegistrationFlow;
