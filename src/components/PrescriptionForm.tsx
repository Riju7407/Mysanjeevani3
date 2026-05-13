'use client';

import { useState } from 'react';
import { Prescription } from '@/lib/models/Prescription';

interface ConsultationData {
  _id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  appointmentDate: string;
  consultationType?: string;
}

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionFormProps {
  consultation: ConsultationData;
  doctor: {
    _id: string;
    name: string;
    registrationNumber: string;
    email: string;
    phone?: string;
  };
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export default function PrescriptionForm({
  consultation,
  doctor,
  onSubmit,
  isLoading = false,
  onCancel,
}: PrescriptionFormProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [doctorAddress, setDoctorAddress] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [error, setError] = useState('');

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!diagnosis.trim()) {
      setError('Please enter a diagnosis');
      return;
    }

    if (medicines.some((m) => !m.name.trim())) {
      setError('Please fill in all medicine names');
      return;
    }

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays));

      await onSubmit({
        consultationId: consultation._id,
        doctorName: doctor.name,
        doctorRegistrationNumber: doctor.registrationNumber,
        doctorAddress,
        diagnosis,
        medicines: medicines.filter((m) => m.name.trim()),
        notes,
        expiryDate: expiryDate.toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create prescription');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Prescription</h2>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Patient:</strong> {consultation.patientName} ({consultation.patientEmail})
        </p>
        <p className="text-sm text-gray-700 mt-1">
          <strong>Appointment Date:</strong> {new Date(consultation.appointmentDate).toLocaleDateString()}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Address */}
        <div>
          <label htmlFor="doctorAddress" className="block text-sm font-medium text-gray-700 mb-2">
            Your Address <span className="text-red-500">*</span>
          </label>
          <textarea
            id="doctorAddress"
            value={doctorAddress}
            onChange={(e) => setDoctorAddress(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500"
            placeholder="Enter your clinic/hospital address"
          />
        </div>

        {/* Diagnosis */}
        <div>
          <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
            Diagnosis <span className="text-red-500">*</span>
          </label>
          <textarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500"
            placeholder="Enter diagnosis details"
          />
        </div>

        {/* Medicines */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Medicines <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAddMedicine}
              className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
            >
              + Add Medicine
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((medicine, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Medicine name"
                  value={medicine.name}
                  onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g., 500mg)"
                  value={medicine.dosage}
                  onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500"
                />
                <input
                  type="text"
                  placeholder="Frequency (e.g., 2x daily)"
                  value={medicine.frequency}
                  onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Duration (e.g., 7 days)"
                    value={medicine.duration}
                    onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500"
                  />
                  {medicines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiry Days */}
        <div>
          <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700 mb-2">
            Prescription Valid For (days)
          </label>
          <input
            type="number"
            id="expiryDays"
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
            min="1"
            max="365"
            className="w-full md:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 placeholder:text-gray-500"
            placeholder="Any additional notes for the patient"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
          >
            {isLoading ? 'Creating...' : 'Create & Send Prescription'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
