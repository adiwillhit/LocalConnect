import { ArrowRight, MapPin, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommunityCard } from '../components/CommunityCard';
import { useAuth } from '../context/AuthContext';
import { communityService } from '../services/communityService';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const res = await communityService.getAll({ limit: 3 });
        setCommunities(res.data || []);
      } catch {
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };
    loadPreview();
  }, []);

  const features = [
    {
      icon: MapPin,
      title: 'Hyperlocal Communities',
      description:
        'Join city and neighborhood hubs like Srinagar, Jammu, Delhi, or Bangalore to stay connected with what matters nearby.',
    },
    {
      icon: MessageSquare,
      title: 'Local News, Jobs & Events',
      description:
        'Publish updates across curated categories—from local job openings and educational opportunities to neighborhood meetups.',
    },
    {
      icon: ShieldCheck,
      title: 'Fast & Reliable Platform',
      description:
        'Built with Redis-cached feeds, atomic interactions, and secure JWT authentication for a smooth everyday experience.',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
              <MapPin className="w-3.5 h-3.5" />
              Hyperlocal Community Network
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Connect with your neighborhood, discover local opportunities.
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed">
              LocalConnect brings neighbors, local businesses, students, and creators together in
              focused, location-based communities. Share updates, ask questions, and stay informed
              about your city.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors shadow-sm"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community Discovery Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Discover Local Communities</h2>
            <p className="text-sm text-slate-600 mt-1">
              Explore active communities near you or start one for your locality.
            </p>
          </div>
          <Link
            to="/communities"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 rounded-2xl bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              No communities created yet. Be the first to launch your city&apos;s community!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {communities.map((community) => (
              <CommunityCard key={community._id} community={community} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <MapPin className="w-4 h-4 text-brand-600" />
            LocalConnect
          </div>
          <p>Hyperlocal Community Platform · Built with React, Express, MongoDB &amp; Redis</p>
        </div>
      </footer>
    </div>
  );
};

