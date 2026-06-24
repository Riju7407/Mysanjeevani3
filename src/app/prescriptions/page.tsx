'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import jsPDF from 'jspdf';

interface PrescriptionData {
  _id: string;
  doctorName: string;
  doctorRegistrationNumber: string;
  doctorAddress: string;
  diagnosis: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes: string;
  issueDate: string;
  expiryDate?: string;
  createdAt: string;
  consultationId: {
    patientName: string;
    appointmentDate: string;
  };
  status: string;
}

interface UserData {
  id?: string;
  _id?: string;
  fullName?: string;
  email?: string;
}

export default function MyPrescriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');

    if (!token || !rawUser) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(rawUser);
      setUser(user);
      fetchPrescriptions(user.id || user._id);
    } catch (err) {
      console.error('Error parsing user:', err);
      router.push('/login');
    }
  }, [router]);

  const fetchPrescriptions = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/prescriptions?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch prescriptions');

      const data = await res.json();
      setPrescriptions(data.prescriptions);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const downloadPrescriptionPDF = async (prescription: PrescriptionData) => {
    setDownloading(prescription._id);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Header - Doctor Details
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PRESCRIPTION', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Dr. ${prescription.doctorName}`, margin, yPosition);
      yPosition += 5;

      if (prescription.doctorRegistrationNumber) {
        doc.text(`Reg. No: ${prescription.doctorRegistrationNumber}`, margin, yPosition);
        yPosition += 5;
      }

      if (prescription.doctorAddress) {
        const addressLines = doc.splitTextToSize(
          prescription.doctorAddress,
          contentWidth
        );
        doc.text(addressLines, margin, yPosition);
        yPosition += addressLines.length * 5 + 5;
      }

      // Separator line
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Patient Details
      doc.setFont('helvetica', 'bold');
      doc.text('Patient Details:', margin, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${prescription.consultationId.patientName}`, margin, yPosition);
      yPosition += 5;

      const appointmentDate = new Date(
        prescription.consultationId.appointmentDate
      ).toLocaleDateString();
      doc.text(`Date of Consultation: ${appointmentDate}`, margin, yPosition);
      yPosition += 5;

      const issueDate = new Date(prescription.issueDate).toLocaleDateString();
      doc.text(`Date of Issue: ${issueDate}`, margin, yPosition);
      yPosition += 8;

      // Diagnosis
      if (prescription.diagnosis) {
        doc.setFont('helvetica', 'bold');
        doc.text('Diagnosis:', margin, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        const diagnosisLines = doc.splitTextToSize(
          prescription.diagnosis,
          contentWidth
        );
        doc.text(diagnosisLines, margin, yPosition);
        yPosition += diagnosisLines.length * 5 + 5;
      }

      // Medicines
      if (prescription.medicines && prescription.medicines.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Medicines:', margin, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        prescription.medicines.forEach((medicine, idx) => {
          const medicineText = `${idx + 1}. ${medicine.name}`;
          const dosageText = `Dosage: ${medicine.dosage} | Frequency: ${medicine.frequency} | Duration: ${medicine.duration}`;

          doc.text(medicineText, margin + 5, yPosition);
          yPosition += 5;

          const dosageLines = doc.splitTextToSize(dosageText, contentWidth - 10);
          doc.text(dosageLines, margin + 5, yPosition);
          yPosition += dosageLines.length * 5 + 3;
        });

        yPosition += 2;
      }

      // Notes
      if (prescription.notes) {
        doc.setFont('helvetica', 'bold');
        doc.text('Additional Notes:', margin, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(prescription.notes, contentWidth);
        doc.text(notesLines, margin, yPosition);
        yPosition += notesLines.length * 5 + 5;
      }

      // Validity
      if (prescription.expiryDate) {
        const expiryDate = new Date(prescription.expiryDate).toLocaleDateString();
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(
          `Valid until: ${expiryDate}`,
          margin,
          pageHeight - margin - 10
        );
      }

      // Footer
      doc.setFontSize(8);
      doc.text(
        'This is a digital prescription generated by MySanjeevani. Please consult your doctor for any clarifications.',
        margin,
        pageHeight - margin
      );

      // Save PDF
      const fileName = `prescription_${prescription.doctorName}_${new Date().getTime()}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('Error downloading prescription:', err);
      setError('Failed to download prescription');
    } finally {
      setDownloading(null);
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/profile"
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 mb-4"
            >
              ← Back to Profile
            </Link>
            <h1 className="text-4xl font-bold text-gray-900">My Prescriptions</h1>
            <p className="text-gray-600 mt-2">
              View and download prescriptions from your doctor consultations
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Prescriptions List */}
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">No prescriptions yet</p>
              <p className="text-gray-500 text-sm">
                Your prescriptions from doctor consultations will appear here
              </p>
              <Link
                href="/doctor-consultation"
                className="inline-block mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Book a Consultation
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription._id}
                  className="bg-white rounded-lg shadow-lg p-6 border border-gray-200"
                >
                  {/* Header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500">Doctor</p>
                      <p className="font-semibold text-gray-900">
                        Dr. {prescription.doctorName}
                      </p>
                      {prescription.doctorRegistrationNumber && (
                        <p className="text-sm text-gray-600">
                          Reg. No: {prescription.doctorRegistrationNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Consultation Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(
                          prescription.consultationId.appointmentDate
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Issued:{' '}
                        {new Date(prescription.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {prescription.diagnosis && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700">
                        Diagnosis
                      </p>
                      <p className="text-gray-700 mt-1">{prescription.diagnosis}</p>
                    </div>
                  )}

                  {/* Medicines */}
                  {prescription.medicines && prescription.medicines.length > 0 && (
                    <div className="mb-4">
                      <p className="font-semibold text-gray-900 mb-2">
                        Medicines:
                      </p>
                      <ul className="space-y-2">
                        {prescription.medicines.map((med, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg"
                          >
                            <strong>{med.name}</strong> - {med.dosage}
                            <br />
                            <span className="text-gray-600">
                              {med.frequency} for {med.duration}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Notes */}
                  {prescription.notes && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Additional Notes:</strong> {prescription.notes}
                      </p>
                    </div>
                  )}

                  {/* Status and Download */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          prescription.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {prescription.status.charAt(0).toUpperCase() +
                          prescription.status.slice(1)}
                      </span>
                      {prescription.expiryDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Valid until:{' '}
                          {new Date(
                            prescription.expiryDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => downloadPrescriptionPDF(prescription)}
                      disabled={downloading === prescription._id}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition font-medium"
                    >
                      {downloading === prescription._id
                        ? 'Downloading...'
                        : 'Download PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
