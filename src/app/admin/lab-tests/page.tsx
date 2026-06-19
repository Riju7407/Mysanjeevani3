'use client';

import { useState, useEffect, useCallback } from 'react';

interface LabTest {
  _id: string;
  testName: string;
  testId?: string;
  category?: string;
  price: number;
  mrp?: number;
  description?: string;
  icon?: string;
  image?: string;
  rating?: number;
  reviews?: number;
  popular?: boolean;
  isActive: boolean;
}

interface ApiLabTest extends LabTest {
  testsIncluded?: string;
  provider?: string;
}

const LAB_TEST_CATEGORIES = [
  'general',
  'diabetic',
  'cardiac',
  'thyroid',
  'liver',
  'kidney',
  'vitamin',
  'infection',
  'womens-health',
];

export default function LabTestsAdmin() {
  const [labTests, setLabTests] = useState<ApiLabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Fetch all lab tests
  const fetchLabTests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('adminToken');

      const response = await fetch('/api/admin/lab-tests?limit=1000', {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Failed to fetch lab tests');

      const data = await response.json();
      const tests = (data.data || data.labTests || []).map((test: any) => ({
        ...test,
        _id: test._id || test.testId,
      }));

      setLabTests(tests);

      // Initialize selected tests (those marked as popular)
      const popularTests = tests.filter((t: ApiLabTest) => t.popular).map((t: ApiLabTest) => t._id);
      setSelectedTests(new Set(popularTests));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lab tests');
      console.error('Error fetching lab tests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  // Toggle test selection
  const toggleTestSelection = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  // Select/Deselect all visible tests
  const toggleSelectAll = () => {
    const visibleTests = getFilteredTests();
    if (selectedTests.size === visibleTests.length) {
      setSelectedTests(new Set());
    } else {
      const allIds = new Set(visibleTests.map((t) => t._id));
      setSelectedTests(allIds);
    }
  };

  // Submit changes
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('Not authenticated');

      // Filter to only local and vendor tests (partner tests can't be updated)
      const updateableTests = labTests.filter(
        (test) => test.provider === 'local' || test.provider === 'vendor' || !test.provider
      );

      const partnerTestsCount = labTests.length - updateableTests.length;

      // Update each test
      const updates = updateableTests.map((test) => ({
        ...test,
        popular: selectedTests.has(test._id),
      }));

      for (const test of updates) {
        const response = await fetch(`/api/admin/lab-tests/${test._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ popular: test.popular }),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP ${response.status}` };
          }
          const testName = test.testName || test._id || 'unknown test';
          const errorMessage = errorData.error || `Server returned status ${response.status}`;
          console.error(`Failed to update ${testName}:`, errorMessage);
          throw new Error(`Failed to update ${testName}: ${errorMessage}`);
        }
      }

      const successMsg = `Successfully updated ${updates.length} popular lab tests!${
        partnerTestsCount > 0 ? ` (Note: ${partnerTestsCount} partner tests cannot be modified)` : ''
      }`;
      setSuccess(successMsg);
      fetchLabTests();
    } catch (err: any) {
      const message = err.message || 'Failed to save changes';
      setError(message);
      console.error('Error saving changes:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter tests
  const getFilteredTests = useCallback(() => {
    return labTests.filter((test) => {
      const matchesSearch = test.testName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || test.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [labTests, searchTerm, selectedCategory]);

  const filteredTests = getFilteredTests();
  const isAllSelected = filteredTests.length > 0 && selectedTests.size === filteredTests.length;
  const isSomeSelected = selectedTests.size > 0 && selectedTests.size < filteredTests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-lg">
              🧪
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Popular Lab Tests Manager</h1>
          </div>
          <p className="text-slate-600">Select which lab tests should appear in the Popular Lab Tests section on the home page.</p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <p className="font-semibold">Error: {error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <p className="font-semibold">✓ {success}</p>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Search Tests</label>
            <input
              type="text"
              placeholder="e.g., Thyroid, Diabetes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Categories</option>
              {LAB_TEST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('-', ' ').charAt(0).toUpperCase() + cat.replace('-', ' ').slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">View Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  viewMode === 'table' ? 'bg-violet-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  viewMode === 'grid' ? 'bg-violet-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{selectedTests.size}</span> test{selectedTests.size !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Showing {filteredTests.length} of {labTests.length} tests
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3">
              <div className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-violet-600 animate-spin" />
              <p className="text-slate-600 font-semibold">Loading lab tests...</p>
            </div>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-600 font-semibold">No lab tests found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between bg-white border border-slate-200 rounded-lg p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700">
                  {isAllSelected ? 'Deselect All' : 'Select All'}
                </span>
              </label>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {filteredTests.map((test) => (
                  <label key={test._id} className="cursor-pointer group">
                    <div
                      className={`h-full p-4 rounded-xl border-2 transition ${
                        selectedTests.has(test._id)
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTests.has(test._id)}
                          onChange={() => toggleTestSelection(test._id)}
                          className="mt-1 w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          {test.icon && <span className="text-2xl mb-2 block">{test.icon}</span>}
                          <p className="font-semibold text-slate-900 text-sm line-clamp-2">{test.testName}</p>
                          {test.category && (
                            <p className="text-xs text-slate-500 mt-1 capitalize">{test.category}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {test.price && (
                              <span className="inline-flex px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                ₹{test.price}
                              </span>
                            )}
                            {test.rating && (
                              <span className="inline-flex px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                                ⭐ {test.rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="mb-8 overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeSelected;
                          }}
                          onChange={toggleSelectAll}
                          className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Test Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Price</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">MRP</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Rating</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredTests.map((test) => (
                      <tr
                        key={test._id}
                        className={`transition ${
                          selectedTests.has(test._id) ? 'bg-violet-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTests.has(test._id)}
                            onChange={() => toggleTestSelection(test._id)}
                            className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            {test.icon && <span className="text-lg">{test.icon}</span>}
                            <span>{test.testName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 capitalize">{test.category || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">₹{test.price || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">₹{test.mrp || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {test.rating ? `⭐ ${test.rating}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              test.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {test.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-3 justify-end">
              <button
                onClick={() => setSelectedTests(new Set())}
                className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Clear Selection
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 disabled:bg-slate-400 transition"
              >
                {submitting ? 'Saving...' : `Save Changes (${selectedTests.size} Selected)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
