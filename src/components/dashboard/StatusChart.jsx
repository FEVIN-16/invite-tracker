import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from '../ui/EmptyState';
import { PieChart as PieChartIcon } from 'lucide-react';
import clsx from 'clsx';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

export function StatusChart({ data, title, hideHeader }) {
  if (!data || data.length === 0) {
    return (
      <div className={clsx("h-[400px] flex flex-col", !hideHeader && "bg-white rounded-2xl border border-gray-200 p-6")}>
        {!hideHeader && <h3 className="text-base font-bold text-gray-900 mb-4">{title} Breakdown</h3>}
        <div className="flex-1 flex items-center justify-center">
          <EmptyState 
            icon={PieChartIcon} 
            heading="No status data" 
            subtext="Add a 'Select' column for RSVP/Status to see charts here." 
          />
        </div>
      </div>
    );
  }

  const chartData = data.filter(d => d.value > 0);

  return (
    <div className={clsx("h-[400px]", !hideHeader && "bg-white rounded-2xl border border-gray-200 p-6")}>
      {!hideHeader && (
        <>
          <h3 className="text-base font-bold text-gray-900 mb-1">{title} Breakdown</h3>
          <p className="text-xs text-gray-400 mb-6">Distribution of guest responses</p>
        </>
      )}
      
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
