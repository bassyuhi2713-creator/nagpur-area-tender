import React, { useState } from 'react';
import { User, SubArea } from '../types';
import { CREDENTIALS } from '../data/initialData';
import { SUB_AREAS } from '../utils/tenderUtils';
import { X, Lock, ShieldCheck, KeyRound } from 'lucide-react';

interface AuthModalProps {
  roleType: 'staffofficer' | 'sae' | 'tendercell' | 'admin' | null;
  roleLabel: string;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  roleType,
  roleLabel,
  onClose,
  onLoginSuccess,
}) => {
  const [selectedSubArea, setSelectedSubArea] = useState<SubArea>('Nagpur Area Execution');
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!roleType) return null;

  const handleSubAreaChange = (subArea: SubArea) => {
    setSelectedSubArea(subArea);
    setUserId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const inputId = userId.trim().toLowerCase();
    const inputPass = password.trim();

    if (roleType === 'staffofficer') {
      if (inputId === CREDENTIALS.staffofficer.id && inputPass === CREDENTIALS.staffofficer.pass) {
        onLoginSuccess({
          role: 'Staff Officer',
          id: inputId,
          name: CREDENTIALS.staffofficer.name,
        });
        return;
      }
    } else if (roleType === 'tendercell') {
      if (inputId === CREDENTIALS.tendercell.id && inputPass === CREDENTIALS.tendercell.pass) {
        onLoginSuccess({
          role: 'Tender Cell',
          id: inputId,
          name: CREDENTIALS.tendercell.name,
        });
        return;
      }
    } else if (roleType === 'admin') {
      if (inputId === CREDENTIALS.admin.id && inputPass === CREDENTIALS.admin.pass) {
        onLoginSuccess({
          role: 'Admin',
          id: inputId,
          name: CREDENTIALS.admin.name,
        });
        return;
      }
    } else if (roleType === 'sae') {
      // Find matching SAE sub-area credential
      const saeCred = CREDENTIALS.sae[inputId];
      if (saeCred && saeCred.pass === inputPass) {
        onLoginSuccess({
          role: 'SAE',
          id: inputId,
          name: saeCred.name,
          subArea: saeCred.subArea,
        });
        return;
      }
    }

    setErrorMsg('Invalid Credentials. Please check User ID and Password.');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative border-t-8 border-[#003366] animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-blue-50 text-[#003366]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{roleLabel}</h2>
            <p className="text-xs text-gray-500">Authorize access to WCL Nagpur Area Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {roleType === 'sae' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Select Sub-Area *
              </label>
              <select
                value={selectedSubArea}
                onChange={(e) => handleSubAreaChange(e.target.value as SubArea)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] bg-white font-medium text-gray-800"
              >
                {SUB_AREAS.map((sa) => (
                  <option key={sa} value={sa}>
                    {sa}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">User ID *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
              <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]"
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-600 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Official Authorization Info */}
          <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[11px] text-gray-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#003366] shrink-0" />
            <span>Please enter your authorized departmental User ID and password to access the portal.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Authorize Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
