import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Tender, AuditLog, SubArea } from './types';
import { INITIAL_TENDERS, INITIAL_LOGS } from './data/initialData';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { TenderList } from './components/TenderList';
import { TenderModal } from './components/TenderModal';
import { AuditLogView } from './components/AuditLogView';
import { ExcelImportModal } from './components/ExcelImportModal';
import {
  fetchServerTenders,
  saveServerTender,
  batchUploadServerTenders,
  deleteServerTender,
  fetchServerLogs,
  saveServerLog,
} from './utils/tenderApi';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [tenders, setTenders] = useState<Tender[]>(() => {
    const stored = localStorage.getItem('wcl_tenders_db');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse tenders from localStorage', e);
      }
    }
    return [];
  });

  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const stored = localStorage.getItem('wcl_logs_db');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse logs from localStorage', e);
      }
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = sessionStorage.getItem('wcl_session');
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        console.error('Failed to parse session from sessionStorage', e);
      }
    }
    return null;
  });

  const [authModal, setAuthModal] = useState<{
    roleType: 'staffofficer' | 'sae' | 'tendercell' | 'admin' | null;
    roleLabel: string;
  }>({ roleType: null, roleLabel: '' });

  const [activeTab, setActiveTab] = useState<TabType>('dash');
  const [selectedSubAreaFilter, setSelectedSubAreaFilter] = useState<SubArea | 'ALL'>('ALL');
  const [isTenderModalOpen, setIsTenderModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [tenderToEdit, setTenderToEdit] = useState<Tender | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(new Date());
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const toastTimerRef = useRef<any>(null);
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ text, type });
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync state to local storage as client backup
  useEffect(() => {
    localStorage.setItem('wcl_tenders_db', JSON.stringify(tenders));
  }, [tenders]);

  useEffect(() => {
    localStorage.setItem('wcl_logs_db', JSON.stringify(logs));
  }, [logs]);

  // Load from Central Server API and poll for multi-user / multi-device synchronization
  const loadDataFromServer = useCallback(async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setIsSyncing(true);
    try {
      const serverTenders = await fetchServerTenders();
      if (serverTenders !== null) {
        setTenders(serverTenders);
      }

      const serverLogs = await fetchServerLogs();
      if (serverLogs !== null) {
        setLogs(serverLogs);
      }

      setLastSyncedTime(new Date());
    } catch (err) {
      console.warn('Sync warning:', err);
    } finally {
      if (showLoadingIndicator) setIsSyncing(false);
    }
  }, []);

  // Initial load + real-time 4-second polling + immediate sync on focus/visibility change
  useEffect(() => {
    loadDataFromServer(true);

    const interval = setInterval(() => {
      loadDataFromServer(false);
    }, 4000);

    const handleWindowFocus = () => {
      loadDataFromServer(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDataFromServer(false);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadDataFromServer]);

  const addLog = async (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      user: currentUser ? currentUser.id : 'System',
      role: currentUser ? currentUser.role : 'System',
      action,
      details,
    };
    setLogs((prev) => [newLog, ...prev]);
    await saveServerLog(newLog);
  };

  const handleOpenAuthModal = (
    roleType: 'staffofficer' | 'sae' | 'tendercell' | 'admin',
    roleLabel: string
  ) => {
    setAuthModal({ roleType, roleLabel });
  };

  const handleCloseAuthModal = () => {
    setAuthModal({ roleType: null, roleLabel: '' });
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('wcl_session', JSON.stringify(user));
    handleCloseAuthModal();
    addLog('Login Success', `User ${user.id} logged in as ${user.role}${user.subArea ? ' (' + user.subArea + ')' : ''}`);
    setActiveTab('dash');
    showToast(`Welcome, ${user.name}! Connected to Central Cloud Database.`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) {
      addLog('Logout', `User ${currentUser.id} logged out`);
    }
    setCurrentUser(null);
    sessionStorage.removeItem('wcl_session');
    setActiveTab('dash');
    showToast('Logged out successfully.', 'info');
  };

  const handleSaveTender = async (savedTender: Tender) => {
    const existingIndex = tenders.findIndex((t) => t.id === savedTender.id);
    let updatedTenders: Tender[];

    if (existingIndex > -1) {
      updatedTenders = [...tenders];
      updatedTenders[existingIndex] = savedTender;
      addLog('Tender Updated', `Tender ${savedTender.id} updated (${savedTender.subArea})`);
      showToast(`Tender ${savedTender.id} updated and synced across all devices!`, 'success');
    } else {
      updatedTenders = [savedTender, ...tenders];
      addLog('Tender Created', `New Tender ${savedTender.id} added for ${savedTender.subArea}`);
      showToast(`New Tender ${savedTender.id} created and broadcasted to all users!`, 'success');
    }

    setTenders(updatedTenders);
    setIsTenderModalOpen(false);
    setTenderToEdit(null);

    // Save to central server for multi-device visibility
    await saveServerTender(savedTender);
  };

  const handleDeleteTender = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this tender record permanently from all systems?')) {
      const filtered = tenders.filter((t) => t.id !== id);
      setTenders(filtered);
      addLog('Tender Deleted', `Tender ${id} deleted by Tender Cell`);
      showToast(`Tender ${id} deleted from central database.`, 'info');
      await deleteServerTender(id);
    }
  };

  const handleBatchImport = async (importedTenders: Tender[], mode: 'merge' | 'replace') => {
    setIsSyncing(true);
    try {
      const res = await batchUploadServerTenders(
        importedTenders,
        mode,
        currentUser?.id || 'tendercellna',
        currentUser?.role || 'Tender Cell'
      );

      if (res.success && res.data) {
        setTenders(res.data);
        showToast(
          `Successfully synced ${importedTenders.length} tenders! Now visible on all devices and user logins.`,
          'success'
        );
      } else {
        // Fallback local update if offline
        if (mode === 'replace') {
          setTenders(importedTenders);
        } else {
          setTenders((prev) => {
            const copy = [...prev];
            importedTenders.forEach((item) => {
              const idx = copy.findIndex((c) => c.id === item.id);
              if (idx >= 0) copy[idx] = item;
              else copy.unshift(item);
            });
            return copy;
          });
        }
        showToast(`Imported ${importedTenders.length} tenders locally.`, 'info');
      }

      await loadDataFromServer(true);
    } catch (err: any) {
      console.error('Batch import error:', err);
      showToast('Error importing file: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenAddModal = () => {
    setTenderToEdit(null);
    setIsTenderModalOpen(true);
  };

  const handleOpenEditModal = (tender: Tender) => {
    setTenderToEdit(tender);
    setIsTenderModalOpen(true);
  };

  const handleCloseTenderModal = () => {
    setIsTenderModalOpen(false);
    setTenderToEdit(null);
  };

  const handleSelectSubAreaDashboardFilter = (subArea: SubArea) => {
    setSelectedSubAreaFilter(subArea);
    setActiveTab('below'); // Jump to tender list with sub-area filtered
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-[#333] flex flex-col font-sans">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-600'
              : toastMessage.type === 'error'
              ? 'bg-red-800 text-white border-red-600'
              : 'bg-blue-900 text-white border-blue-700'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-300 shrink-0" />}
            {toastMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-300 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        tenders={tenders}
        onOpenUrgentTab={() => setActiveTab('urgent')}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onRefreshData={() => {
          loadDataFromServer(true);
          showToast('Refreshing tender data from central server...', 'info');
        }}
        isSyncing={isSyncing}
        lastSyncedTime={lastSyncedTime}
      />

      {/* Navigation */}
      {currentUser && (
        <Navigation
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          tenders={tenders}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {!currentUser ? (
          <LandingPage onOpenAuth={handleOpenAuthModal} />
        ) : (
          <>
            {activeTab === 'dash' && (
              <Dashboard
                tenders={tenders}
                currentUser={currentUser}
                onNavigate={(tab) => setActiveTab(tab)}
                onSelectSubAreaFilter={handleSelectSubAreaDashboardFilter}
              />
            )}

            {(activeTab === 'below' || activeTab === 'above' || activeTab === 'urgent') && (
              <TenderList
                tenders={tenders}
                currentUser={currentUser}
                viewCategory={activeTab}
                initialSubAreaFilter={selectedSubAreaFilter}
                onOpenAddModal={handleOpenAddModal}
                onOpenEditModal={handleOpenEditModal}
                onDeleteTender={handleDeleteTender}
                onOpenImportModal={() => setIsImportModalOpen(true)}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogView
                logs={logs}
                onClearLogs={() => {
                  if (window.confirm('Clear all system activity logs?')) {
                    setLogs([]);
                    addLog('Logs Cleared', 'Admin cleared activity log history');
                  }
                }}
                isAdmin={currentUser.role === 'Admin'}
              />
            )}
          </>
        )}
      </main>

      {/* Auth Modal (Passwords hidden from view) */}
      <AuthModal
        roleType={authModal.roleType}
        roleLabel={authModal.roleLabel}
        onClose={handleCloseAuthModal}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Add / Edit Tender Modal */}
      <TenderModal
        isOpen={isTenderModalOpen}
        tenderToEdit={tenderToEdit}
        onClose={handleCloseTenderModal}
        onSave={handleSaveTender}
      />

      {/* Excel / CSV Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        currentUser={currentUser}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleBatchImport}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 px-4 text-center mt-12">
        <p className="text-xs font-bold text-gray-700">
          Western Coalfields Limited — Nagpur Area Civil Division
        </p>
        <p className="text-xs font-bold text-[#003366] mt-1">
          Designed and Developed for and by WCL Nagpur Area – Retik Gupta (MT – Civil)
        </p>
      </footer>
    </div>
  );
}
