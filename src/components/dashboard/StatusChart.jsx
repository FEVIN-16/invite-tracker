import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { EmptyState } from '../ui/EmptyState';
import { PieChart as PieChartIcon } from 'lucide-react';
import clsx from 'clsx';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

export function StatusChart({ data, title, hideHeader }) {
  if (!data || data.length === 0) {
    return (
      <div className={clsx("h-[400px] flex flex-col", !hideHeader && "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg")}>
        {!hideHeader && <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">{title} Breakdown</h3>}
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
    <div className={clsx("h-[400px]", !hideHeader && "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg")}>
      {!hideHeader && (
        <>
          <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">{title} Breakdown</h3>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-8 uppercase tracking-widest">Distribution of responses</p>
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
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                backgroundColor: 'var(--tooltip-bg, #111827)',
                color: '#fff',
                fontWeight: '900',
                padding: '12px'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
