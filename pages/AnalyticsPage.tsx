import React from 'react';
import type { Character } from '../types';
import { BarChartIcon } from '../components/icons';

interface AnalyticsPageProps {}

const AnalyticsPage: React.FC<AnalyticsPageProps> = () => {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8 flex items-center justify-center">
      <div className="text-center text-text-secondary">
        <BarChartIcon className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-text-primary">Analytics Under Construction</h1>
        <p className="mt-2">This page is temporarily disabled to focus on vector embedding implementation.</p>
      </div>
    </div>
  );
};

export default AnalyticsPage;