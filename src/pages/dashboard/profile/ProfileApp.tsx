/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { getProviderProfile } from "@/api/provider.api";

import { useGlobalContext } from '@/context/GlobalProvider';

function ProfileApp() {
  const [activeTab, setActiveTab] = useState('account-info');
  const [userType, setUserType] = useState<string>('CUSTOMER');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { id: userId, role: type } = useParams<{ id: string; role: string }>();
  const { user: globalUser } = useGlobalContext();
  const completionStatus = useProfileCompletion(user, userType);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getProviderProfile(axiosInstance, userId);
        // getProviderProfile returns response.data
        const fetchedUser = response?.data || response;

        if (!fetchedUser || typeof fetchedUser !== 'object') {
          setError('User not found');
          return;
        }

        setUser(fetchedUser);
        setUserType(fetchedUser.userType || type?.toUpperCase() || 'CUSTOMER');
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, type]);

  useEffect(() => {
    if (globalUser) {
      const role = (globalUser.userType || globalUser.role || '')?.toString().toUpperCase();
      setIsAdmin(role === 'ADMIN' || role === 'SUPER_ADMIN');
    }
  }, [globalUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType={userType}
        completionStatus={completionStatus}
        userData={user}
      />
      <MainContent
        activeTab={activeTab}
        userType={userType}
        userData={user}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default ProfileApp;