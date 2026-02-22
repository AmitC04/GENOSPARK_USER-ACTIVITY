import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/metric-card';
import { ActivityFeedItem } from '@/components/activity-feed-item';
import {
  BookOpen, CheckCircle, Award, Flame,
  GraduationCap, ShoppingCart, Star, Shield, LogIn,
  TrendingUp, Calendar, BarChart2, X,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';

function getActivityIcon(type: string): LucideIcon {
  switch (type) {
    case 'course_enrolled':  return GraduationCap;
    case 'course_completed': return CheckCircle;
    case 'order_placed':     return ShoppingCart;
    case 'review_submitted': return Star;
    case 'login':            return LogIn;
    default:                 return Shield;
  }
}

function formatRelativeTime(dateString: string): string {
  const diff      = Date.now() - new Date(dateString).getTime();
  const diffMins  = Math.floor(diff / 60000);
  const diffHours = Math.floor(diff / 3600000);
  const diffDays  = Math.floor(diff / 86400000);
  if (diffMins  <  1) return 'Just now';
  if (diffMins  < 60) return `${diffMins} minute${diffMins  > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours  > 1 ? 's' : ''} ago`;
  if (diffDays  <  7) return `${diffDays} day${diffDays    > 1 ? 's' : ''} ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeStreak(activities: any[]): number {
  const loginDays = new Set(
    activities
      .filter(a => a.type === 'login')
      .map(a => new Date(a.createdAt).toDateString()),
  );
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (loginDays.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

export function OverviewPage() {
  const [activities,  setActivities]  = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any>({ enrollments: [], pagination: { total: 0 } });
  const [profile,     setProfile]     = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [dateFilter,  setDateFilter]  = useState('7days');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [actRes, enrRes, proRes] = await Promise.all([
          apiClient.activities.getAll({ limit: 100 }),
          apiClient.enrollments.getAll({ limit: 1000 }),
          apiClient.auth.getProfile(),
        ]);
        setActivities(actRes.data?.data?.activities   ?? []);
        setEnrollments(enrRes.data?.data ?? { enrollments: [], pagination: { total: 0 } });
        setProfile(proRes.data?.data ?? null);
      } catch (_) {
        // silently fail – show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allEnrollments: any[] = enrollments.enrollments ?? [];
  const totalEnrollments = enrollments.pagination?.total ?? allEnrollments.length;
  const activeCount    = allEnrollments.filter((e: any) => e.status === 'active').length;
  const completedCount = allEnrollments.filter((e: any) => e.status === 'completed').length;
  const streak         = computeStreak(activities);

  const now = new Date();
  const cutoffs: Record<string, Date> = {
    '7days':  new Date(now.getTime() -  7 * 86400000),
    '30days': new Date(now.getTime() - 30 * 86400000),
    '90days': new Date(now.getTime() - 90 * 86400000),
  };

  let filtered = activities.filter(a => new Date(a.createdAt) >= cutoffs[dateFilter]);
  if (typeFilter === 'courses') filtered = filtered.filter(a => ['course_enrolled', 'course_completed'].includes(a.type));
  else if (typeFilter === 'orders')  filtered = filtered.filter(a => a.type === 'order_placed');
  else if (typeFilter === 'reviews') filtered = filtered.filter(a => a.type === 'review_submitted');

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth    = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const loginDaysThisMonth = new Set(
    activities
      .filter(a => a.type === 'login' && new Date(a.createdAt) >= thisMonthStart)
      .map(a => new Date(a.createdAt).getDate()),
  ).size;
  const loginPercent   = Math.round((loginDaysThisMonth / daysInMonth) * 100);
  const reviewsWritten = activities.filter(a => a.type === 'review_submitted').length;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const activeWeekDaySet = new Set(
    activities
      .filter(a => a.type === 'login' && new Date(a.createdAt) >= weekStart)
      .map(a => new Date(a.createdAt).getDay()),
  );

  const firstName = profile?.name?.split(' ')[0] ?? 'there';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ color: '#2c3e50', fontWeight: 'bold' }}>
          My Activity Dashboard
        </h1>
        <p className="text-gray-600">Welcome back, {firstName}! 👋</p>
        <p className="text-sm text-gray-500">Here's your learning journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon={BookOpen}    value={totalEnrollments} label="Total Enrollments"        color="text-blue-600"   />
        <MetricCard icon={CheckCircle} value={activeCount}      label="Active Courses"           color="text-green-600"  />
        <MetricCard icon={Award}       value={completedCount}   label="Certifications Completed" color="text-purple-600" />
        <MetricCard icon={Flame}       value={`${streak} Day${streak !== 1 ? 's' : ''}`} label="Current Streak" color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl" style={{ color: '#2c3e50', fontWeight: 600 }}>
                Recent Activity
              </h2>
              <div className="flex gap-2">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="courses">Courses</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="reviews">Reviews</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading activities…</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No activities found.</div>
              ) : (
                filtered.slice(0, 6).map((activity, i) => (
                  <ActivityFeedItem
                    key={activity.id ?? i}
                    icon={getActivityIcon(activity.type)}
                    description={activity.description}
                    timestamp={formatRelativeTime(activity.createdAt)}
                    isUnread={!activity.isRead}
                  />
                ))
              )}
            </div>
            {filtered.length > 6 && (
              <div className="p-4 text-center border-t">
                <Button variant="outline">Load More</Button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg mb-4" style={{ color: '#2c3e50', fontWeight: 600 }}>
              Quick Stats
            </h3>
            <p className="text-sm text-gray-600 mb-4">This Month</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Login Days</span>
                <span className="text-lg" style={{ color: '#2c3e50', fontWeight: 600 }}>
                  {loginDaysThisMonth}/{daysInMonth}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${loginPercent}%` }} />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-700">Courses Enrolled</span>
                <span className="text-lg" style={{ color: '#2c3e50', fontWeight: 600 }}>{totalEnrollments}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Reviews Written</span>
                <span className="text-lg" style={{ color: '#2c3e50', fontWeight: 600 }}>{reviewsWritten}</span>
              </div>
            </div>

            <Button variant="link" className="w-full mt-6" style={{ color: '#3498db' }} onClick={() => setAnalyticsOpen(true)}>
              View All Analytics →
            </Button>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-sm p-6 mt-6 text-white">
            <div className="text-center">
              <div className="text-5xl mb-3">🔥</div>
              <h3 className="text-2xl mb-2" style={{ fontWeight: 'bold' }}>
                {streak} Day{streak !== 1 ? 's' : ''} Streak!
              </h3>
              <p className="text-sm opacity-90 mb-4">Keep it going! Next goal: 30 days</p>
              <div className="flex justify-center gap-2 mb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="text-xs opacity-75 mb-1">{day}</div>
                    <div className={`size-6 rounded-full flex items-center justify-center ${
                      activeWeekDaySet.has(i) ? 'bg-white' : 'bg-white bg-opacity-30'
                    }`}>
                      {activeWeekDaySet.has(i) && <span className="text-xs text-orange-500">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── View All Analytics Modal ─────────────────────────────── */}
      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <BarChart2 className="size-5 text-blue-400" /> Full Analytics Overview
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            {/* Summary metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Enrollments',  value: totalEnrollments,  icon: BookOpen,    color: 'text-blue-400' },
                { label: 'Active Courses',     value: activeCount,       icon: CheckCircle, color: 'text-green-400' },
                { label: 'Completed',          value: completedCount,    icon: Award,       color: 'text-purple-400' },
                { label: 'Current Streak',     value: `${streak}d`,      icon: Flame,       color: 'text-orange-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-zinc-800 rounded-lg p-3 text-center">
                  <Icon className={`size-5 mx-auto mb-1 ${color}`} />
                  <div className="text-xl font-bold text-white">{value}</div>
                  <div className="text-xs text-zinc-400">{label}</div>
                </div>
              ))}
            </div>

            {/* This month stats */}
            <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Calendar className="size-4 text-blue-400" /> This Month
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Login Days</span>
                  <span className="font-semibold text-white">{loginDaysThisMonth} / {daysInMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Login Rate</span>
                  <span className="font-semibold text-white">{loginPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Reviews Written</span>
                  <span className="font-semibold text-white">{reviewsWritten}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Action Events</span>
                  <span className="font-semibold text-white">{activities.length}</span>
                </div>
              </div>
              <div className="h-2 bg-zinc-700 rounded-full mt-2">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${loginPercent}%` }} />
              </div>
            </div>

            {/* Activity breakdown */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-zinc-200 flex items-center gap-2 mb-3">
                <TrendingUp className="size-4 text-green-400" /> Activity Breakdown (All Time)
              </h4>
              <div className="space-y-2">
                {[
                  { type: 'login',            label: 'Logins',            color: 'bg-blue-500'   },
                  { type: 'course_enrolled',  label: 'Course Enrollments', color: 'bg-purple-500' },
                  { type: 'order_placed',     label: 'Orders Placed',      color: 'bg-green-500'  },
                  { type: 'review_submitted', label: 'Reviews Written',     color: 'bg-yellow-500' },
                  { type: 'profile_updated',  label: 'Profile Updates',     color: 'bg-orange-500' },
                ].map(({ type, label, color }) => {
                  const count = activities.filter(a => a.type === type).length;
                  const max   = Math.max(1, activities.length);
                  return (
                    <div key={type} className="flex items-center gap-3 text-sm">
                      <span className="text-zinc-400 w-36 truncate">{label}</span>
                      <div className="flex-1 bg-zinc-700 rounded-full h-1.5">
                        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                      <Badge variant="secondary" className="bg-zinc-700 text-zinc-200 text-xs min-w-[2rem] justify-center">{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly activity heat */}
            <div className="bg-zinc-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-zinc-200 mb-3">Active Days This Week</h4>
              <div className="flex gap-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full h-8 rounded ${activeWeekDaySet.has(i) ? 'bg-blue-500' : 'bg-zinc-700'} flex items-center justify-center`}>
                      {activeWeekDaySet.has(i) && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-[10px] text-zinc-500">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
