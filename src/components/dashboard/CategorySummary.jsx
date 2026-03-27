import { Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export function CategorySummary({ data }) {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-900">Guest Breakdown</h3>
          <p className="text-xs text-gray-400">Guests per category</p>
        </div>
        <Users className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {sortedData.map((cat) => (
          <div key={cat.id} className="group flex items-center gap-4">
            <div 
              className="w-1.5 h-10 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-sm font-semibold text-gray-800 truncate">{cat.name}</span>
                 <span className="text-sm font-bold text-indigo-600">{cat.count}</span>
               </div>
               <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
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
        className="w-full mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2 border-t border-gray-100 flex items-center justify-center gap-2"
      >
        Manage Categories
      </button>
    </div>
  );
}
