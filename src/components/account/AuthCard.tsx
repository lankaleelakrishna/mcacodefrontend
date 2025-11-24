import React from 'react';

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  logoSrc?: string;
  subtitle?: string;
}

const AuthCard: React.FC<AuthCardProps> = ({ title, children, logoSrc, subtitle }) => (
  <div style={{ minHeight: '100vh', backgroundColor: '#9fbfb0' }} className="flex justify-center items-center pb-16">
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
      {logoSrc && (
        <img src={logoSrc} alt="Logo" className="w-20 h-20 mb-4 rounded-full object-cover" />
      )}
      <h2 className="text-2xl font-bold text-green-900 mb-2 text-center">{title}</h2>
      {subtitle && <p className="text-gray-500 mb-6 text-center">{subtitle}</p>}
      {children}
    </div>
  </div>
);

export default AuthCard;
