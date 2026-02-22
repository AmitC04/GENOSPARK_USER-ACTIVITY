import { useState, useEffect } from 'react';
import { TimelineEvent } from '@/components/timeline-event';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Globe, Mail, Shield, CheckCircle, Download, User, FileSpreadsheet } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function getEventMeta(type: string): { icon: LucideIcon; iconColor: string; title: string } {
  switch (type) {
    case 'login':            return { icon: Globe,       iconColor: 'bg-green-600',  title: 'Login' };
    case 'registration':     return { icon: CheckCircle, iconColor: 'bg-green-600',  title: 'Account Created' };
    case 'password_changed': return { icon: Lock,        iconColor: 'bg-blue-600',   title: 'Password Changed' };
    case 'profile_updated':  return { icon: User,        iconColor: 'bg-purple-600', title: 'Profile Updated' };
    case 'email_updated':    return { icon: Mail,        iconColor: 'bg-purple-600', title: 'Email Updated' };
    default:                 return { icon: Shield,      iconColor: 'bg-blue-600',   title: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
  }
}

const SECURITY_TYPES = new Set([
  'login', 'registration', 'password_changed', 'profile_updated', 'email_updated',
]);

export function SecurityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('30days');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    apiClient.activities
      .getAll({ limit: 100 })
      .then(res => setActivities(res.data?.data?.activities ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const cutoffs: Record<string, Date> = {
    '7days':  new Date(now.getTime() -  7 * 86400000),
    '30days': new Date(now.getTime() - 30 * 86400000),
    '90days': new Date(now.getTime() - 90 * 86400000),
    'all':    new Date(0),
  };

  let events = activities.filter(
    a => SECURITY_TYPES.has(a.type) && new Date(a.createdAt) >= cutoffs[dateFilter],
  );

  if (typeFilter === 'login')    events = events.filter(a => a.type === 'login');
  if (typeFilter === 'password') events = events.filter(a => a.type === 'password_changed');
  if (typeFilter === 'profile')  events = events.filter(a => ['profile_updated', 'email_updated'].includes(a.type));

  const handleExportSecurityLog = () => {
    const rows = [
      ['Date', 'Event', 'Description'],
      ...events.map(a => [
        formatDate(a.createdAt),
        getEventMeta(a.type).title,
        a.description ?? '',
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `security-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
    toast.success('Security log exported successfully');
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Account Security
        </h1>
        <p className="text-gray-600">Track all security-related activities on your account</p>
      </div>

      <div className="flex gap-3 mb-6">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="login">Logins</SelectItem>
            <SelectItem value="password">Password</SelectItem>
            <SelectItem value="profile">Profile</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <Button variant="outline" onClick={() => setExportOpen(true)}>
          <Download className="size-4 mr-2" /> Export Security Log
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading security events…</div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No security events found.</div>
        ) : (
          <div className="py-4">
            {events.map((activity, index) => {
              const { icon, iconColor, title } = getEventMeta(activity.type);
              return (
                <TimelineEvent
                  key={activity.id ?? index}
                  icon={icon}
                  iconColor={iconColor}
                  title={title}
                  date={formatDate(activity.createdAt)}
                  description={activity.description}
                  isLast={index === events.length - 1}
                  {...(activity.type === 'login' && {
                    action: {
                      label: "This wasn't me?",
                      onClick: () => toast.error('Security alert submitted. Our team will review this activity.'),
                    },
                  })}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Export Security Log Dialog ─────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileSpreadsheet className="size-5 text-green-400" /> Export Security Log
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            <div className="bg-zinc-800 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-300">
                <span>Events to export</span>
                <span className="font-semibold text-white">{events.length}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Date range</span>
                <span className="font-semibold text-white capitalize">{dateFilter === 'all' ? 'All time' : dateFilter}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Event type</span>
                <span className="font-semibold text-white capitalize">{typeFilter === 'all' ? 'All events' : typeFilter}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              The CSV will include Date, Event Type and Description columns for all matching security events.
            </p>
            {events.length === 0 ? (
              <p className="text-center text-sm text-zinc-500 py-2">No events match the current filters.</p>
            ) : (
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleExportSecurityLog}>
                <Download className="size-4 mr-2" /> Download CSV ({events.length} events)
              </Button>
            )}
            <Button variant="outline" className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800" onClick={() => setExportOpen(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
