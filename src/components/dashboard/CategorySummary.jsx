import { Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';

export function CategorySummary({ data, hideHeader }) {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const sortedData = [...data].sort((a, b) => b.count - (a.count || 0));

  return (
    <div className={clsx(!hideHeader && "bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-lg")}>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">Guest Breakdown</h3>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Guests per category</p>
          </div>
          <Users className="w-5 h-5 text-gray-400 dark:text-gray-600" />
        </div>
      )}

      <div className="space-y-4">
        {sortedData.map((cat) => (
          <div key={cat.id} className="group flex items-center gap-4">
            <div 
              className="w-1.5 h-10 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center mb-1.5 px-0.5">
                 <span className="text-sm font-bold text-gray-800 dark:text-white truncate">{cat.name}</span>
                 <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{cat.count}</span>
               </div>
               <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_-2px_rgba(0,0,0,0.1)]"
                    style={{ 
                      backgroundColor: cat.color, 
                      width: `${Math.min(100, (cat.count / (sortedData[0].count || 1)) * 100)}%` 
                    }}
                  />
               </div>
            </div>
          </div>
        ))}

        {sortedData.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No categories created yet.</p>
        )}
      </div>

      <button 
        onClick={() => navigate(`/events/${eventId}/categories`)}
        className="w-full mt-6 text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-3 border-t border-gray-50 dark:border-gray-800 flex items-center justify-center gap-2 transition-colors"
      >
        Manage Categories
      </button>
    </div>
  );
}
