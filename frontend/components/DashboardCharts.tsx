'use client';

import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

type BorrowRequest = {
  id: number;
  requested_at: string;
  processed_at?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  returned_at?: string | null;
};

type DashboardChartsProps = {
  analyticsBorrowRequests: BorrowRequest[];
  borrowRequests: BorrowRequest[];
  returnRequests: any[];
};

export default function DashboardCharts({
  analyticsBorrowRequests,
  borrowRequests,
  returnRequests,
}: DashboardChartsProps) {
  // Prepare data for Borrow Activity chart (last 7 days)
  const borrowActivityData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map((date) => {
      const borrowed = analyticsBorrowRequests.filter((req) => {
        const reqDate = req.processed_at?.split('T')[0] || req.requested_at.split('T')[0];
        return reqDate === date && req.status === 'APPROVED';
      }).length;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        borrowed,
      };
    });
  }, [analyticsBorrowRequests]);

  // Prepare data for Borrow vs Return chart (last 7 days)
  const borrowVsReturnData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map((date) => {
      const borrowed = analyticsBorrowRequests.filter((req) => {
        const reqDate = req.processed_at?.split('T')[0] || req.requested_at.split('T')[0];
        return reqDate === date && req.status === 'APPROVED';
      }).length;

      const returned = analyticsBorrowRequests.filter((req) => {
        const returnDate = req.returned_at?.split('T')[0];
        return returnDate === date && req.status === 'RETURNED';
      }).length;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        borrowed,
        returned,
      };
    });
  }, [analyticsBorrowRequests]);

  // Prepare data for Active Students Trend (last 7 days)
  const activeStudentsTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map((date) => {
      const uniqueUsers = new Set(
        analyticsBorrowRequests
          .filter((req) => {
            const reqDate = req.requested_at.split('T')[0];
            return reqDate === date;
          })
          .map((req) => (req as any).user?.id)
          .filter(Boolean)
      );

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        students: uniqueUsers.size,
      };
    });
  }, [analyticsBorrowRequests]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Data Visualization
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Library Activity Trends</h2>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Borrow Activity Line Chart */}
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50/50 to-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">Borrow Activity</h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">Books borrowed per day (last 7 days)</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={borrowActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="borrowed" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Borrowed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Active Students Trend */}
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-teal-50/50 to-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-teal-600" />
            <h3 className="text-base font-semibold text-slate-900">Active Students Trend</h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">Daily active students (last 7 days)</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={activeStudentsTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke="#14b8a6" 
                strokeWidth={3}
                dot={{ fill: '#14b8a6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Active Students"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Borrow vs Return Bar Chart */}
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-purple-50/50 to-white p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h3 className="text-base font-semibold text-slate-900">Borrow vs Return</h3>
          </div>
          <p className="text-xs text-slate-600 mb-4">Comparison of borrowed and returned books (last 7 days)</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={borrowVsReturnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
              />
              <Bar 
                dataKey="borrowed" 
                fill="#3b82f6" 
                radius={[8, 8, 0, 0]}
                name="Borrowed"
              />
              <Bar 
                dataKey="returned" 
                fill="#10b981" 
                radius={[8, 8, 0, 0]}
                name="Returned"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
