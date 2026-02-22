'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart3, BookOpen, CreditCard, Star, Shield, Smartphone,
  Settings, HelpCircle, LogOut, Menu, Bell, User, X, Check,
  CheckCheck, ChevronRight, Lock, Mail, Cpu, Globe, AlertCircle,
  LogIn, UserPlus, Key, Edit3, Loader2,
} from 'lucide-react';
import { OverviewPage }  from '@/components/pages/overview-page';
import { CoursesPage }   from '@/components/pages/courses-page';
import { OrdersPage }    from '@/components/pages/orders-page';
import { ReviewsPage }   from '@/components/pages/reviews-page';
import { SecurityPage }  from '@/components/pages/security-page';
import { SessionsPage }  from '@/components/pages/sessions-page';
import { Button }        from '@/components/ui/button';
import { Toaster }       from '@/components/ui/sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Input }         from '@/components/ui/input';
import { Label }         from '@/components/ui/label';
import { Badge }         from '@/components/ui/badge';
import { apiClient }     from '@/lib/api-client';
import { toast }         from 'sonner';

type Page = 'overview' | 'courses' | 'orders' | 'reviews' | 'security' | 'sessions';

interface Activity {
  id: string;
  type: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt: string;
}

const ACTIVITY_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  login:            { icon: LogIn,        color: 'text-blue-500'   },
  registration:     { icon: UserPlus,     color: 'text-green-500'  },
  password_changed: { icon: Key,          color: 'text-orange-500' },
  profile_updated:  { icon: Edit3,        color: 'text-purple-500' },
  email_updated:    { icon: Mail,         color: 'text-teal-500'   },
  course_enrolled:  { icon: BookOpen,     color: 'text-indigo-500' },
  order_placed:     { icon: CreditCard,   color: 'text-blue-500'   },
  review_submitted: { icon: Star,         color: 'text-yellow-500' },
};

function notifIcon(type: string) {
  const entry = ACTIVITY_ICON[type] ?? { icon: AlertCircle, color: 'text-gray-400' };
  return entry;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const FAQ_ITEMS = [
  {
    q: 'How do I enroll in a course?',
    a: 'Browse the course catalog, click on any course you are interested in, and click "Enroll Now". After successful payment your enrollment will appear under My Courses.',
  },
  {
    q: 'Where can I track my learning progress?',
    a: 'Head to the My Courses page. Each card shows a progress bar with your current completion percentage. You can also see streak and quick stats on the Overview dashboard.',
  },
  {
    q: 'How do I download my certificate?',
    a: 'After completing 100 % of a course, a "Download Certificate" button appears on the course card under My Courses.',
  },
  {
    q: 'Can I get a refund for an order?',
    a: 'Refunds are available within 7 days of purchase if you have not accessed more than 10 % of the course content. Open the Orders page, find the order, and click "Request Refund".',
  },
  {
    q: 'How do I change my password?',
    a: 'Currently password changes are handled via the Security page. Look for "Change Password" in the account security section. A password-reset email flow is on our roadmap.',
  },
  {
    q: 'Why is my session shown on multiple devices?',
    a: 'Each browser or device you log in from creates a separate session. Go to the Sessions page to view and terminate any sessions you don\'t recognise.',
  },
  {
    q: 'How do I update my profile name or avatar?',
    a: 'Click the Settings button in the sidebar, edit your name or avatar URL, and hit Save.',
  },
  {
    q: 'I found a bug — how do I report it?',
    a: 'Please email support@genospark.io with a description and screenshot. Our team will get back to you within 1 business day.',
  },
];

export default function Dashboard() {
  const [currentPage,         setCurrentPage]         = useState<Page>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [profile,             setProfile]             = useState<Profile | null>(null);

  // Notifications state
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState<Activity[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifLoading,  setNotifLoading]  = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Profile dropdown state
  const [profileOpen,  setProfileOpen]  = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Settings sheet state
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [editName,      setEditName]      = useState('');
  const [editAvatar,    setEditAvatar]    = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Help dialog state
  const [helpOpen, setHelpOpen] = useState(false);

  // ── load profile ──────────────────────────────────────────────────
  const loadProfile = useCallback(() => {
    apiClient.auth
      .getProfile()
      .then(res => {
        const p = res.data?.data ?? null;
        setProfile(p);
        if (p) { setEditName(p.name); setEditAvatar(p.avatar ?? ''); }
      })
      .catch(() => {});
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── unread badge (poll every 30 s) ───────────────────────────────
  useEffect(() => {
    const fetch = () =>
      apiClient.activities
        .getUnreadCount()
        .then(res => setUnreadCount(res.data?.data?.unreadCount ?? 0))
        .catch(() => {});
    fetch();
    const id = setInterval(fetch, 30_000);
    return () => clearInterval(id);
  }, []);

  // ── close dropdowns on outside click ────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── open notifications dropdown ──────────────────────────────────
  const openNotifications = useCallback(() => {
    setNotifOpen(prev => {
      if (!prev) {
        setNotifLoading(true);
        apiClient.activities
          .getAll({ limit: 15 })
          .then(res => setNotifications(res.data?.data?.activities ?? []))
          .catch(() => {})
          .finally(() => setNotifLoading(false));
      }
      return !prev;
    });
    setProfileOpen(false);
  }, []);

  // ── mark single notification read ───────────────────────────────
  const markRead = useCallback((id: string) => {
    apiClient.activities.markAsRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  // ── mark all as read ─────────────────────────────────────────────
  const markAllRead = useCallback(() => {
    apiClient.activities.markAllAsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // ── logout ───────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.reload();
    }
  }, []);

  // ── save settings ────────────────────────────────────────────────
  const handleSaveSettings = useCallback(async () => {
    setSettingsSaving(true);
    try {
      await apiClient.auth.updateProfile({
        name:   editName.trim()   || undefined,
        avatar: editAvatar.trim() || undefined,
      });
      await loadProfile();
      setSettingsOpen(false);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  }, [editName, editAvatar, loadProfile]);

  const initials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const navItems = [
    { id: 'overview' as Page, icon: BarChart3, label: 'Overview' },
    { id: 'courses' as Page, icon: BookOpen, label: 'My Courses' },
    { id: 'orders' as Page, icon: CreditCard, label: 'Orders' },
    { id: 'reviews' as Page, icon: Star, label: 'Reviews' },
    { id: 'security' as Page, icon: Shield, label: 'Security' },
    { id: 'sessions' as Page, icon: Smartphone, label: 'Sessions' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <OverviewPage />;
      case 'courses':  return <CoursesPage />;
      case 'orders':   return <OrdersPage />;
      case 'reviews':  return <ReviewsPage />;
      case 'security': return <SecurityPage />;
      case 'sessions': return <SessionsPage />;
      default:         return <OverviewPage />;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b" style={{ borderColor: '#ecf0f1' }}>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            G
          </div>
          <div>
            <h1 className="text-lg text-slate-900 font-bold">GenoSpark</h1>
            <p className="text-xs text-gray-500">Learning Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setCurrentPage(item.id); setIsMobileSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {profile && (
        <div className="px-4 py-3 border-t" style={{ borderColor: '#ecf0f1' }}>
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.name} className="size-9 rounded-full object-cover" />
                : initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{profile.name}</p>
              <p className="text-xs text-gray-500 truncate">{profile.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t space-y-1" style={{ borderColor: '#ecf0f1' }}>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700"
          onClick={() => { setSettingsOpen(true); setIsMobileSidebarOpen(false); }}
        >
          <Settings className="size-5 mr-3" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-700"
          onClick={() => { setHelpOpen(true); setIsMobileSidebarOpen(false); }}
        >
          <HelpCircle className="size-5 mr-3" />
          Help
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="size-5 mr-3" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white border rounded-lg"
      >
        {isMobileSidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`${isMobileSidebarOpen ? 'fixed' : 'hidden md:flex'} inset-0 z-30 md:relative md:w-64 flex flex-col bg-white border-r md:border-r`}
        style={{ borderColor: '#ecf0f1' }}
      >
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between"
          style={{ borderColor: '#ecf0f1' }}
        >
          <h2 className="text-xl font-semibold text-slate-900 capitalize hidden md:block">
            {currentPage === 'overview' ? 'Dashboard'         :
             currentPage === 'courses'  ? 'My Courses'        :
             currentPage === 'orders'   ? 'Orders'            :
             currentPage === 'reviews'  ? 'Reviews'           :
             currentPage === 'security' ? 'Security Settings' :
             'Active Sessions'}
          </h2>

          <div className="flex items-center gap-3 ml-auto">

            {/* ── Bell / Notifications ──────────────────────────── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden"
                  style={{ borderColor: '#e2e8f0' }}>
                  {/* header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                    <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <CheckCheck className="size-3.5" /> Mark all read
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* body */}
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="size-5 animate-spin text-blue-500" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400">No notifications yet</div>
                    ) : (
                      notifications.map(n => {
                        const { icon: Icon, color } = notifIcon(n.type);
                        return (
                          <div
                            key={n.id}
                            onClick={() => !n.isRead && markRead(n.id)}
                            className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 cursor-pointer transition-colors ${
                              n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/60 hover:bg-blue-50'
                            }`}
                            style={{ borderColor: '#f1f5f9' }}
                          >
                            <div className={`mt-0.5 flex-shrink-0 ${color}`}>
                              <Icon className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 leading-snug">{n.description}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                            </div>
                            {!n.isRead && (
                              <span className="flex-shrink-0 size-2 rounded-full bg-blue-500 mt-1.5" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* footer */}
                  <div className="border-t px-4 py-2.5" style={{ borderColor: '#f1f5f9' }}>
                    <button
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                      onClick={() => { setCurrentPage('security'); setNotifOpen(false); }}
                    >
                      View all activity <ChevronRight className="size-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── User avatar / Profile dropdown ───────────────── */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
                className="size-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="User menu"
              >
                {profile?.avatar
                  ? <img src={profile.avatar} alt={profile.name} className="size-9 object-cover" />
                  : profile ? initials : <User className="size-4" />}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border z-50 overflow-hidden"
                  style={{ borderColor: '#e2e8f0' }}>
                  {profile && (
                    <div className="px-4 py-3 border-b" style={{ borderColor: '#f1f5f9' }}>
                      <p className="text-sm font-semibold text-slate-800 truncate">{profile.name}</p>
                      <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px] capitalize">{profile.role}</Badge>
                    </div>
                  )}
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                      onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}
                    >
                      <Settings className="size-4 text-gray-400" /> Edit Profile
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                      onClick={() => { setCurrentPage('sessions'); setProfileOpen(false); }}
                    >
                      <Smartphone className="size-4 text-gray-400" /> Active Sessions
                    </button>
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                      onClick={() => { setCurrentPage('security'); setProfileOpen(false); }}
                    >
                      <Shield className="size-4 text-gray-400" /> Security
                    </button>
                    <div className="border-t my-1" style={{ borderColor: '#f1f5f9' }} />
                    <button
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="size-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 pt-16 md:pt-8">
            {renderPage()}
          </div>
        </main>
      </div>

      {/* ── Settings Sheet ──────────────────────────────────────── */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-zinc-900 border-zinc-700 text-white">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Settings className="size-5 text-blue-400" /> Settings
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Profile section */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <User className="size-4 text-zinc-500" /> Profile Information
              </h3>

              {/* Avatar preview */}
              {editAvatar && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-800 rounded-lg">
                  <img
                    src={editAvatar}
                    alt="avatar preview"
                    className="size-12 rounded-full object-cover border border-zinc-600"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="text-xs text-zinc-400">Avatar preview</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-name" className="text-zinc-300">Display Name</Label>
                  <Input
                    id="settings-name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="settings-avatar" className="text-zinc-300">Avatar URL</Label>
                  <Input
                    id="settings-avatar"
                    value={editAvatar}
                    onChange={e => setEditAvatar(e.target.value)}
                    placeholder="https://…"
                    type="url"
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
                  />
                  <p className="text-xs text-zinc-500">Paste a direct link to your profile image</p>
                </div>
              </div>
            </div>

            {/* Read-only info */}
            {profile && (
              <div className="space-y-3 pt-2 border-t border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2 pt-2">
                  <Lock className="size-4 text-zinc-500" /> Account Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Email</span>
                    <span className="font-medium text-zinc-100 truncate max-w-[180px]">{profile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Role</span>
                    <Badge variant="secondary" className="capitalize text-xs bg-zinc-700 text-zinc-200">{profile.role}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Member since</span>
                    <span className="font-medium text-zinc-100">
                      {new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1"
                onClick={handleSaveSettings}
                disabled={settingsSaving}
              >
                {settingsSaving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Check className="size-4 mr-2" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Help Dialog ─────────────────────────────────────────── */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <HelpCircle className="size-5 text-blue-400" /> Help & FAQ
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <p className="text-sm text-zinc-400">
              Quick answers to common questions about the GenoSpark Learning Platform.
            </p>

            <Accordion type="multiple" className="w-full">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-zinc-700">
                  <AccordionTrigger className="text-sm text-left font-medium text-zinc-200 hover:text-white">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-zinc-400 leading-relaxed">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="pt-2 border-t border-zinc-700 text-center">
              <p className="text-xs text-zinc-500">
                Still need help? Email us at{' '}
                <a href="mailto:support@genospark.io" className="text-blue-400 hover:underline">
                  support@genospark.io
                </a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
