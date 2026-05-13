'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PrescriptionForm from '@/components/PrescriptionForm';

interface ConsultationData {
  _id: string;
  userId?: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  appointmentDate: string;
  consultationType?: string;
  prescription?: string;
}

interface PrescriptionData {
  _id: string;
  consultationId: ConsultationData;
  userId: { fullName: string; email: string };
  doctorName: string;
  doctorAddress: string;
  diagnosis: string;
  medicines: any[];
  notes: string;
  createdAt: string;
}

interface DoctorUser {
  id?: string;
  _id?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

export default function DoctorPrescriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DoctorUser | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [completedConsultations, setCompletedConsultations] = useState<ConsultationData[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('view');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');

    if (!token || !rawUser) {
      router.push('/doctor/login');
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      setUser(user);
      fetchDoctorProfile(user.id || user._id);
    } catch (err) {
      console.error('Error parsing user:', err);
      router.push('/doctor/login');
    }
  }, [router]);

  const fetchDoctorProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/doctor/profile?userId=${userId}`);

      if (!res.ok) throw new Error('Failed to fetch profile');

      const data = await res.json();
      setDoctorProfile(data.doctor);
      await fetchConsultations(data.doctor._id);
      await fetchPrescriptions(data.doctor._id);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async (doctorId: string) => {
    try {
      const res = await fetch(`/api/doctor/consultations-list?doctorId=${doctorId}&status=completed`);
      if (!res.ok) throw new Error('Failed to fetch consultations');

      const data = await res.json();
      // Filter out consultations that already have prescriptions
      const withoutPrescriptions = data.consultations.filter((c: any) => !c.prescription);
      setCompletedConsultations(withoutPrescriptions);
    } catch (err) {
      console.error('Error fetching consultations:', err);
    }
  };

  const fetchPrescriptions = async (doctorId: string) => {
    try {
      const res = await fetch(`/api/doctor/prescriptions?doctorId=${doctorId}`);
      if (!res.ok) throw new Error('Failed to fetch prescriptions');

      const data = await res.json();
      setPrescriptions(data.prescriptions);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    }
  };

  const handleCreatePrescription = async (prescriptionData: any) => {
    if (!user || !doctorProfile || !selectedConsultation) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      // Use the patient's userId from the consultation, not the doctor's userId
      const patientUserId = selectedConsultation.userId?._id || selectedConsultation.userId;

      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: patientUserId,
          doctorId: doctorProfile._id,
          ...prescriptionData,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create prescription');
      }

      const prescriptionRes = await res.json();
      const prescriptionId = prescriptionRes.prescription._id;

      // Send notification to patient
      try {
        await fetch('/api/prescriptions/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prescriptionId }),
        });
      } catch (notifyErr) {
        console.error('Failed to send notification:', notifyErr);
        // Don't fail the operation if notification fails
      }

      setSuccess('Prescription created and sent to patient successfully!');
      setShowForm(false);
      setSelectedConsultation(null);

      // Refresh data
      await fetchConsultations(doctorProfile._id);
      await fetchPrescriptions(doctorProfile._id);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create prescription');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Prescriptions</h1>
            <p className="text-gray-600 mt-2">Manage and send prescriptions to your patients</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('view');
                setShowForm(false);
              }}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'view'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              View Prescriptions ({prescriptions.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('create');
                setShowForm(true);
              }}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'create'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Create New ({completedConsultations.length})
            </button>
          </div>

          {/* Content */}
          {activeTab === 'view' ? (
            <div className="space-y-6">
              {prescriptions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">No prescriptions created yet</p>
                </div>
              ) : (
                prescriptions.map((prescription) => (
                  <div key={prescription._id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Patient</p>
                        <p className="font-semibold text-gray-900">
                          {prescription.userId.fullName}
                        </p>
                        <p className="text-sm text-gray-600">{prescription.userId.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Appointment Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(prescription.consultationId.appointmentDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Diagnosis:</strong> {prescription.diagnosis}
                      </p>
                    </div>

                    {prescription.medicines.length > 0 && (
                      <div className="mb-4">
                        <p className="font-semibold text-gray-900 mb-2">Medicines:</p>
                        <ul className="space-y-1">
                          {prescription.medicines.map((med, idx) => (
                            <li key={idx} className="text-sm text-gray-700">
                              • {med.name} - {med.dosage}, {med.frequency}, {med.duration}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {prescription.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {prescription.notes}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Created on {new Date(prescription.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {showForm && selectedConsultation ? (
                <PrescriptionForm
                  consultation={selectedConsultation}
                  doctor={{
                    _id: doctorProfile._id,
                    name: doctorProfile.name,
                    registrationNumber: doctorProfile.registrationNumber,
                    email: doctorProfile.email,
                    phone: doctorProfile.phone,
                  }}
                  onSubmit={handleCreatePrescription}
                  isLoading={submitting}
                  onCancel={() => {
                    setShowForm(false);
                    setSelectedConsultation(null);
                  }}
                />
              ) : (
                <>
                  {completedConsultations.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                      <p className="text-gray-500">
                        No completed consultations available for prescription creation
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedConsultations.map((consultation) => (
                        <div
                          key={consultation._id}
                          className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {consultation.patientName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {consultation.patientEmail}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Appointment:{' '}
                              {new Date(consultation.appointmentDate).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedConsultation(consultation);
                              setShowForm(true);
                            }}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                          >
                            Create Prescription
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
