
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
      <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Generador de Mockups y Banners con IA
      </h1>
      <p className="text-center text-sm text-gray-400 mt-1">
        Crea visuales de marketing impactantes con el poder de Gemini.
      </p>
    </header>
  );
};

export default Header;
