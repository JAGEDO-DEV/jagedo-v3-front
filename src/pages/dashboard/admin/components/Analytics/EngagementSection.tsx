import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getFeatureUsage, getLoginFrequency, getOtpSuccessFailure, getSessionTracking } from "@/api/analytics.api";

// engagement analytics
export const EngagementSection: React.FC<{ timePeriod: string }> = ({ timePeriod }) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [loginFreq, setLoginFreq] = useState<any[]>([]);
  const [otpStats, setOtpStats] = useState<{ success: number; failure: number }>({ success: 0, failure: 0 });
  const [sessionTrackingData, setSessionTrackingData] = useState<any>(null);
  const [featureUsageData, setFeatureUsageData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const period = timePeriod !== 'All' ? timePeriod : undefined;
        const [lf, os, st, fu] = await Promise.all([
          getLoginFrequency(axiosInstance, period),
          getOtpSuccessFailure(axiosInstance, period),
          getSessionTracking(axiosInstance, period),
          getFeatureUsage(axiosInstance, period)
        ]);
        setLoginFreq(lf.data.frequency || []);
        setOtpStats({ success: os.data.success, failure: os.data.failure });
        setSessionTrackingData(st.data);
        setFeatureUsageData(fu.data.features || []);
      } catch (e: any) {
        console.error('Error loading engagement analytics', e);
        setError(e.message || 'Failed to load engagement analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [timePeriod, axiosInstance]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading engagement analytics...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Engagement Analytics</h2>
      <Card>
        <CardHeader>
          <CardTitle>Login Frequency</CardTitle>
          <CardDescription>Daily login activity over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {loginFreq.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={loginFreq}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-8">No login data available</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>OTP Success vs Failure</CardTitle>
          <CardDescription>OTP authentication success and failure rates</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const otpPieData = [
              { label: "Success", value: otpStats.success, color: "#10b981" },
              { label: "Failure", value: otpStats.failure, color: "#ef4444" },
            ].filter((d) => d.value > 0);

            return otpPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={otpPieData}
                    dataKey="value"
                    nameKey="label"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {otpPieData.map((entry, index) => (
                      <Cell key={`otp-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} attempts`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-8">No OTP stats available</div>
            );
          })()}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Success</p>
              <p className="text-2xl font-bold text-green-600">{otpStats.success}</p>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <p className="text-sm text-gray-600">Failure</p>
              <p className="text-2xl font-bold text-red-600">{otpStats.failure}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Session Tracking</CardTitle>
          <CardDescription>Total user sessions during the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionTrackingData ? (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Logins</p>
              <p className="text-4xl font-bold text-blue-600">{sessionTrackingData.totalLogins}</p>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No session data available</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Feature Usage</CardTitle>
          <CardDescription>Module interactions and feature usage breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {featureUsageData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2">Feature</th>
                      <th className="text-right py-2">Usage Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureUsageData.map((feature, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{feature.feature}</td>
                        <td className="text-right">{feature.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">No feature usage data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};