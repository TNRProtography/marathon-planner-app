
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full text-center py-6 md:py-8">
      <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-300">
        Marathon Training Planner
      </h1>
      <p className="mt-3 text-lg text-slate-300">
        Chart your course to marathon success. Plan runs, swims, and rest days.
      </p>
    </header>
  );
};

export default Header;
