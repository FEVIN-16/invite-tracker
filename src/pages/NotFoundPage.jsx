import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { SearchX } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <SearchX className="w-16 h-16 text-gray-300 mb-4" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/events"><Button>Go to My Events</Button></Link>
    </div>
  );
}
