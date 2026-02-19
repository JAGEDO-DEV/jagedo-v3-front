/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

function ProfileApp() {
  const [activeTab, setActiveTab] = useState('account-info');
  const [userType, setUserType] = useState<string>('CUSTOMER');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id: userId, role: type } = useParams<{ id: string; role: string }>();
  const location = useLocation();
  const completionStatus = useProfileCompletion(user, userType);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (userId) {
          const response = await axiosInstance.get(`/api/admin/profiles/${userId}`);
          const fetchedUser = response.data.data;
          console.log("Fetched User Data: ", fetchedUser)
          setUser(fetchedUser);
          setUserType(fetchedUser.userType || type?.toUpperCase() || 'CUSTOMER');
        } else {
          throw new Error('No user ID provided');
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user profile');

        if (userId) {
          setUser({
            id: userId,
            name: 'User Profile',
            email: 'N/A',
            userType: type?.toUpperCase() || 'CUSTOMER'
          });
          setUserType(type?.toUpperCase() || 'CUSTOMER');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, type]);

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
      />
    </div>

  );
}

export default ProfileApp;
