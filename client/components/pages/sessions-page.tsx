import { useState, useEffect, useCallback } from 'react';
import { SessionCard } from '@/components/session-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Lock, Shield, Smartphone, AlertTriangle, Key, Eye,
  CheckCircle2, Wifi, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins  <  1) return 'Just now';
  if (mins  < 60) return `${mins} minute${mins  > 1 ? 's' : ''} ago`;
  if (hrs   < 24) return `${hrs} hour${hrs    > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function SessionsPage() {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [securityOpen,   setSecurityOpen]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, allRes] = await Promise.all([
        apiClient.sessions.getActive(),
        apiClient.sessions.getAll(),
      ]);
      const active: any[] = activeRes.data?.data ?? [];
      const all:    any[] = allRes.data?.data?.sessions ?? [];
      active.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      setActiveSessions(active);
      setRecentSessions(all.filter((s: any) => !s.isActive));
    } catch (_) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEndSession = async (sessionId: string, device: string) => {
    try {
      await apiClient.sessions.endSession(sessionId);
      toast.success(`Session ended successfully for ${device}`);
      load();
    } catch (_) {
      toast.error('Failed to end session. Please try again.');
    }
  };

  const handleEndAllSessions = async () => {
    try {
      await apiClient.sessions.endAllSessions();
      toast.success('All other sessions have been ended');
      load();
    } catch (_) {
      toast.error('Failed to end sessions. Please try again.');
    }
  };

  const currentSession = activeSessions[0];
  const otherSessions  = activeSessions.slice(1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Active Sessions
        </h1>
        <p className="text-gray-600">Manage your active login sessions</p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading sessions…</div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl" style={{ color: '#2c3e50', fontWeight: 600 }}>
                Active Sessions ({activeSessions.length})
              </h2>
              <Button variant="destructive" onClick={handleEndAllSessions}>
                End All Other Sessions
              </Button>
            </div>

            {activeSessions.length === 0 ? (
              <p className="text-gray-500">No active sessions found.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentSession && (
                  <SessionCard
                    device={currentSession.device}
                    location={currentSession.location ?? 'Unknown'}
                    ipAddress={currentSession.ipAddress ?? 'N/A'}
                    activeSince={formatDate(currentSession.createdAt)}
                    lastActivity={formatRelativeTime(currentSession.lastActive)}
                    isCurrent={true}
                  />
                )}
                {otherSessions.map((s: any) => (
                  <SessionCard
                    key={s.id}
                    device={s.device}
                    location={s.location ?? 'Unknown'}
                    ipAddress={s.ipAddress ?? 'N/A'}
                    activeSince={formatDate(s.createdAt)}
                    lastActivity={formatRelativeTime(s.lastActive)}
                    isCurrent={false}
                    onEndSession={() => handleEndSession(s.id, s.device)}
                  />
                ))}
              </div>
            )}
          </div>

          {recentSessions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl" style={{ color: '#2c3e50', fontWeight: 600 }}>
                  Recent Sessions (Last 7 Days)
                </h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Login Time</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSessions.map((s: any, i: number) => (
                    <TableRow key={s.id ?? i}>
                      <TableCell>{s.device}</TableCell>
                      <TableCell>{s.location ?? 'Unknown'}</TableCell>
                      <TableCell>{formatDate(s.createdAt)}</TableCell>
                      <TableCell>{formatRelativeTime(s.lastActive)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800">Ended</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex gap-4">
          <div className="text-3xl">🔒</div>
          <div className="flex-1">
            <h3 className="text-base mb-2" style={{ color: '#2c3e50', fontWeight: 600 }}>
              Security Tip
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              If you see a session that you don't recognize, end it immediately and change your password.
              Enable two-factor authentication for additional security.
            </p>
            <Button variant="outline" size="sm" onClick={() => setSecurityOpen(true)}>
              Learn About Account Security
            </Button>
          </div>
        </div>
      </div>

      {/* ── Learn About Security Dialog ──────────────────────────── */}
      <Dialog open={securityOpen} onOpenChange={setSecurityOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Shield className="size-5 text-blue-400" /> Account Security Guide
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">

            {[
              {
                icon: Eye,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
                title: 'Review Sessions Regularly',
                body: 'Check your active sessions page often. Each entry shows the device, browser, IP address and location. If anything looks unfamiliar, end that session immediately.',
              },
              {
                icon: AlertTriangle,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                title: 'Unrecognised Session?',
                body: 'Click "End Session" next to any session you don\'t recognise. Then change your password right away. This prevents anyone who may have your credentials from remaining logged in.',
              },
              {
                icon: Key,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
                title: 'Strong Passwords',
                body: 'Use a unique password of at least 12 characters that mixes letters, numbers and symbols. Never reuse the same password across different services.',
              },
              {
                icon: Wifi,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                title: 'Avoid Public Wi-Fi',
                body: 'Logging in from public or untrusted networks increases your risk. If you must use public Wi-Fi, always use a VPN before accessing your account.',
              },
              {
                icon: RefreshCw,
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                title: 'End All Sessions After Sharing a Device',
                body: 'If you ever log in on a shared or public computer, use "End All Other Sessions" from this page as soon as you are done to ensure no one else can access your account.',
              },
              {
                icon: Lock,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                title: 'Secure Your Email Too',
                body: 'Your account recovery depends on your email. Make sure your email provider account also has a strong password and 2-factor authentication enabled.',
              },
              {
                icon: Smartphone,
                color: 'text-teal-400',
                bg: 'bg-teal-500/10',
                title: 'Keep Devices Updated',
                body: 'Always keep your device\'s operating system and browser up to date. Security patches prevent known vulnerabilities from being exploited.',
              },
              {
                icon: CheckCircle2,
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                title: 'You\'re in Control',
                body: 'The Sessions page gives you full visibility and control over every active login. Check the Security page to see a complete log of login events and profile changes on your account.',
              },
            ].map(({ icon: Icon, color, bg, title, body }) => (
              <div key={title} className={`flex gap-3 rounded-lg p-3 ${bg}`}>
                <Icon className={`size-5 flex-shrink-0 mt-0.5 ${color}`} />
                <div>
                  <p className="text-sm font-semibold text-zinc-100 mb-0.5">{title}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}

            <Button
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white mt-2"
              onClick={() => setSecurityOpen(false)}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
