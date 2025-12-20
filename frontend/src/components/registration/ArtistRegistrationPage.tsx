import React from 'react';
import ArtistRegistrationFlow from './ArtistRegistrationFlow';
import './registration.css';
import './registration-enhanced.css';

const ArtistRegistrationPage: React.FC = () => {
  return (
    <div className="registration-container">
      <ArtistRegistrationFlow />
    </div>
  );
};

export default ArtistRegistrationPage;
