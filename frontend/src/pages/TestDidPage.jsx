/**
 * D-ID Test Page for Nauti-Bouys
 * Standalone page for testing D-ID integration
 */

import React from 'react';
import TestDidIntegration from '../components/TestDidIntegration';

const TestDidPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">D-ID Integration Testing</h1>
          <p className="mt-2 text-sm text-gray-600">
            Test D-ID API integration for Nauti-Bouys AI Assistant avatar functionality
          </p>
        </div>
      </div>

      {/* Test Component */}
      <TestDidIntegration />
    </div>
  );
};

export default TestDidPage;