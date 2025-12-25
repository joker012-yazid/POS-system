import { useState, useEffect } from 'react';
import { CloudArrowUpIcon, CloudArrowDownIcon, TrashIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { getSettings, updateCompanyProfile, updatePrintSettings } from './settingsService';
import { downloadBackup } from '@/services/export-import/exportService';
import { readBackupFile, importData } from '@/services/export-import/importService';
import { clearAllData } from '@/services/storage/clearAll';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastHost';
import { useConfirm } from '@/components/ConfirmDialog';
import { getErrorMessage } from '@/lib/errors';
import type { Settings, CompanyProfile, PrintSettings } from '@/services/storage/types';

export function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const confirm = useConfirm();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [companyForm, setCompanyForm] = useState<CompanyProfile>({
    name: '',
    address: '',
    phone: '',
  });

  const [printForm, setPrintForm] = useState<PrintSettings>({
    mode: 'a4',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
      setCompanyForm(data.companyProfile);
      setPrintForm(data.printSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    try {
      await updateCompanyProfile(companyForm);
      addToast('success', 'Profil syarikat berjaya disimpan');
      loadSettings();
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleSavePrint = async () => {
    try {
      await updatePrintSettings(printForm);
      addToast('success', 'Tetapan cetakan berjaya disimpan');
      loadSettings();
    } catch (error) {
      addToast('error', getErrorMessage(error));
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadBackup(user!.id);
      addToast('success', 'Backup berjaya dimuat turun');
    } catch (error) {
      addToast('error', getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = await confirm({
      title: 'Import Data?',
      message: 'Ini akan MENGGANTIKAN semua data sedia ada dengan data dari backup. Pastikan anda sudah membuat backup terlebih dahulu.',
      confirmText: 'Ya, Import',
      variant: 'warning',
    });

    if (!confirmed) {
      e.target.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const backup = await readBackupFile(file);
      const result = await importData(backup, user!.id);

      if (result.success) {
        addToast('success', 'Data berjaya diimport');
        window.location.reload();
      } else {
        addToast('error', result.error || 'Gagal import data');
      }
    } catch (error) {
      addToast('error', getErrorMessage(error));
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleClearData = async () => {
    const confirmed = await confirm({
      title: 'Padam Semua Data?',
      message: 'AMARAN: Tindakan ini akan MEMADAM SEMUA DATA dan tidak boleh dibatalkan. Pastikan anda sudah membuat backup terlebih dahulu.',
      confirmText: 'Ya, Padam Semua',
      variant: 'danger',
    });

    if (confirmed) {
      const doubleConfirm = await confirm({
        title: 'Sahkan Sekali Lagi',
        message: 'Adakah anda benar-benar pasti? Semua data akan hilang.',
        confirmText: 'Ya, Saya Pasti',
        variant: 'danger',
      });

      if (doubleConfirm) {
        try {
          await clearAllData();
          addToast('success', 'Semua data telah dipadam');
          window.location.reload();
        } catch (error) {
          addToast('error', getErrorMessage(error));
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Tetapan</h1>

      {/* Company Profile */}
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-semibold">Profil Syarikat</h2>
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="label">Nama Syarikat</label>
            <input
              type="text"
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              className="input mt-1"
            />
          </div>

          <div>
            <label className="label">Alamat</label>
            <textarea
              rows={2}
              value={companyForm.address || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              className="input mt-1"
            />
          </div>

          <div>
            <label className="label">No. Telefon</label>
            <input
              type="tel"
              value={companyForm.phone || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              className="input mt-1"
            />
          </div>

          <button onClick={handleSaveCompany} className="btn btn-primary">
            Simpan Profil
          </button>
        </div>
      </section>

      {/* Print Settings */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Tetapan Cetakan</h2>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="label">Mode Cetakan</label>
            <select
              value={printForm.mode}
              onChange={(e) => setPrintForm({ ...printForm, mode: e.target.value as 'a4' | 'thermal' })}
              className="input mt-1"
            >
              <option value="a4">A4</option>
              <option value="thermal">Thermal</option>
            </select>
          </div>

          {printForm.mode === 'thermal' && (
            <div>
              <label className="label">Lebar Kertas (mm)</label>
              <select
                value={printForm.thermalWidthMm || 58}
                onChange={(e) => setPrintForm({ ...printForm, thermalWidthMm: parseInt(e.target.value) })}
                className="input mt-1"
              >
                <option value={58}>58mm</option>
                <option value={80}>80mm</option>
              </select>
            </div>
          )}

          <button onClick={handleSavePrint} className="btn btn-primary">
            Simpan Tetapan
          </button>
        </div>
      </section>

      {/* Backup & Restore */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Backup & Restore</h2>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn btn-secondary flex-1"
            >
              <CloudArrowDownIcon className="h-5 w-5 mr-2" />
              {isExporting ? 'Mengeksport...' : 'Eksport Backup'}
            </button>

            <label className="btn btn-secondary flex-1 cursor-pointer">
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              {isImporting ? 'Mengimport...' : 'Import Backup'}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>

          <p className="text-sm text-gray-500">
            Eksport data untuk backup atau import dari backup sedia ada. Data import akan menggantikan semua data yang ada.
          </p>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="card p-6 border-red-200 bg-red-50">
        <h2 className="text-lg font-semibold text-red-700 mb-4">Zon Bahaya</h2>

        <div className="space-y-4">
          <button onClick={handleClearData} className="btn btn-danger">
            <TrashIcon className="h-5 w-5 mr-2" />
            Padam Semua Data
          </button>

          <p className="text-sm text-red-600">
            Tindakan ini akan memadam semua data dan tidak boleh dibatalkan. Pastikan anda sudah membuat backup.
          </p>
        </div>
      </section>
    </div>
  );
}
