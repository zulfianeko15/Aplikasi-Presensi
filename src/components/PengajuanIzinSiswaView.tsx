import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import {
  Calendar,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  Info,
  CalendarDays
} from 'lucide-react';

interface PengajuanIzinSiswaViewProps {
  currentUser: {
    role: string;
    nama?: string;
    nisn?: string;
    kelas?: string;
  };
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PengajuanIzinSiswaView({ currentUser, showToast }: PengajuanIzinSiswaViewProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'riwayat'>('form');
  const [jenis, setJenis] = useState<'Izin' | 'Sakit'>('Izin');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [dokumenUrl, setDokumenUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Riwayat Pengajuan
  const [riwayatList, setRiwayatList] = useState<any[]>([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);

  // Set default today's date
  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setTanggalMulai(today);
    setTanggalSelesai(today);
  }, []);

  const loadRiwayat = async () => {
    if (!currentUser.nisn) return;
    try {
      setLoadingRiwayat(true);
      const res = await api.getPengajuanIzin({ nisn: currentUser.nisn });
      if (res.success && Array.isArray(res.data)) {
        setRiwayatList(res.data);
      }
    } catch (err: any) {
      console.warn('Gagal memuat riwayat pengajuan:', err);
    } finally {
      setLoadingRiwayat(false);
    }
  };

  useEffect(() => {
    loadRiwayat();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.nisn || !currentUser.nama) {
      showToast('Data akun siswa tidak valid.', 'error');
      return;
    }

    if (!tanggalMulai || !tanggalSelesai) {
      showToast('Pilih tanggal mulai dan tanggal selesai pengajuan.', 'error');
      return;
    }

    if (tanggalSelesai < tanggalMulai) {
      showToast('Tanggal selesai tidak boleh sebelum tanggal mulai.', 'error');
      return;
    }

    if (!keterangan.trim()) {
      showToast('Tuliskan alasan atau keterangan pengajuan Anda.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createPengajuanIzin({
        nisn: currentUser.nisn,
        nama: currentUser.nama,
        kelas: currentUser.kelas || '',
        jenis,
        tanggalMulai,
        tanggalSelesai,
        keterangan,
        dokumenUrl,
      });

      if (res.success) {
        showToast('✓ Pengajuan izin/sakit berhasil dikirim! Menunggu pengecekan Admin.', 'success');
        setKeterangan('');
        setDokumenUrl('');
        setActiveTab('riwayat');
        loadRiwayat();
      } else {
        showToast(res.message || 'Gagal mengirim pengajuan.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white mb-2">
            Layanan Mandiri Siswa
          </span>
          <h2 className="text-xl md:text-2xl font-black">Form Pengajuan Izin & Sakit</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Ajukan permohonan ketidakhadiran secara online. Permohonan akan diverifikasi oleh Admin/Wali Kelas.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="bg-black/30 p-1.5 rounded-2xl flex border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'form' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Buat Pengajuan</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('riwayat');
              loadRiwayat();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'riwayat' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Riwayat ({riwayatList.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'form' ? (
        /* Form View */
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Info Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nama Siswa:</span>
                <p className="font-bold text-slate-800 text-sm">{currentUser.nama}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">NISN:</span>
                <p className="font-mono font-bold text-indigo-600">{currentUser.nisn}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Kelas:</span>
                <p className="font-bold text-slate-700">{currentUser.kelas || '-'}</p>
              </div>
            </div>

            {/* Jenis Pengajuan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Jenis Pengajuan <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setJenis('Izin')}
                  className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                    jenis === 'Izin'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${jenis === 'Izin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Izin</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Keperluan keluarga, acara penting, atau dinas luar.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setJenis('Sakit')}
                  className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer ${
                    jenis === 'Sakit'
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${jenis === 'Sakit' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Sakit</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Sedang mengalami gangguan kesehatan / dirawat.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Rentang Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dari Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tanggalMulai}
                  onChange={(e) => {
                    setTanggalMulai(e.target.value);
                    if (tanggalSelesai < e.target.value) setTanggalSelesai(e.target.value);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sampai Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={tanggalMulai}
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Keterangan Detail */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alasan / Keterangan Lengkap <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Mengikuti acara pernikahan kakak kandung di luar kota / Sakit demam tinggi dan disarankan dokter istirahat..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Link Bukti / Dokumen Pendukung (Opsional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Link Dokumen / Surat Dokter (Opsional)
              </label>
              <input
                type="text"
                value={dokumenUrl}
                onChange={(e) => setDokumenUrl(e.target.value)}
                placeholder="Masukkan link Google Drive, foto surat keterangan dokter, atau catatan pendukung"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
              <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <p>
                <strong>Catatan Penting:</strong> Setelah formulir ini dikirimkan, status absensi Anda pada tanggal tersebut akan menunggu pengecekan dan persetujuan dari pihak Admin/Guru.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-200 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mengirimkan Pengajuan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>KIRIM PENGAJUAN SEKARANG</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Riwayat View */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Riwayat Pengajuan Izin & Sakit Anda</h3>
              <p className="text-[11px] text-slate-400">Pantau proses peninjauan oleh pihak Admin/Sekolah</p>
            </div>
            <button
              onClick={loadRiwayat}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
              title="Perbarui data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRiwayat ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingRiwayat ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Memuat data pengajuan...</span>
            </div>
          ) : riwayatList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">Belum ada pengajuan izin atau sakit.</p>
              <p className="text-slate-400">Gunakan tab "Buat Pengajuan" untuk mengajukan permohonan baru.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {riwayatList.map((item) => {
                const isPending = item.status === 'Menunggu Persetujuan';
                const isApproved = item.status === 'Disetujui';
                const isRejected = item.status === 'Ditolak';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                            item.jenis === 'Sakit' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.jenis}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {item.tanggalMulai === item.tanggalSelesai
                            ? item.tanggalMulai
                            : `${item.tanggalMulai} s/d ${item.tanggalSelesai}`}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isPending
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {isPending && <Clock className="w-3.5 h-3.5 animate-spin" />}
                        {isApproved && <CheckCircle className="w-3.5 h-3.5" />}
                        {isRejected && <XCircle className="w-3.5 h-3.5" />}
                        <span>{item.status}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100">
                      <strong>Alasan:</strong> {item.keterangan}
                    </p>

                    {item.dokumenUrl && (
                      <p className="text-[11px] text-indigo-600 truncate">
                        <strong>Lampiran:</strong>{' '}
                        <a href={item.dokumenUrl} target="_blank" rel="noreferrer" className="underline hover:text-indigo-800">
                          {item.dokumenUrl}
                        </a>
                      </p>
                    )}

                    {/* Catatan Admin jika sudah ditinjau */}
                    {item.catatanAdmin && (
                      <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 border-l-4 border-indigo-600">
                        <span className="font-bold text-[10px] uppercase text-indigo-700 block mb-0.5">
                          Tanggapan Admin ({item.reviewedBy || 'Pihak Sekolah'}):
                        </span>
                        <p>{item.catatanAdmin}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
