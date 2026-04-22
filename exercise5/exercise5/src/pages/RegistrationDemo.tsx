import React from 'react';
import { MultiStepRegistrationForm } from '../exercise6';

const RegistrationDemo: React.FC = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <MultiStepRegistrationForm />
    </main>
  );
};

export default RegistrationDemo;
