import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminUserRecord, AdminSpaceRecord, AdminStatsOverview, OrbColor, WaveShape } from '../types';
import { LivingOrb } from './LivingOrb';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  Users,
  Database,
  Radio,
  Server,
  Download,
  Trash2,
  Check,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Send,
  X,
  UserCheck,
  Terminal,
  Activity,
  Layers,
  FileCode,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface AdminPanelModalProps {
  onClose: () => void;
  currentUserEmail?: string;
  onOpenSpace?: (spaceId: string) => void;
}

type AdminTab = 'overview' | 'users' | 'spaces' | 'broadcast' | 'mysql';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  onClose,
  currentUserEmail,
  onOpenSpace,
}) => {
  const { isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [stats, setStats] = useState<AdminStatsOverview | null>(null);
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [spacesList, setSpacesList] = useState<AdminSpaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('اطلاعیه کیهانی مدیریت');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastWave, setBroadcastWave] = useState<WaveShape>('radiant_burst');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // MySQL Connection Test state
  const [testHost, setTestHost] = useState('');
  const [testPort, setTestPort] = useState('3306');
  const [testUser, setTestUser] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testDatabase, setTestDatabase] = useState('');
  const [testTesting, setTestTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('skala_session_token') || '' : '';

  const fetchAdminData = async () => {
    setRefreshing(true);
    setErrorMsg(null);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-session-token': token,
      };

      const [overviewRes, usersRes, spacesRes] = await Promise.all([
        fetch('/api/admin/overview', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/spaces', { headers }),
      ]);

      if (!overviewRes.ok) {
        throw new Error('عدم دسترسی به پنل مدیریت یا جلسه منقضی شده است');
      }

      const overviewData: AdminStatsOverview = await overviewRes.json();
      const usersData = await usersRes.json();
      const spacesData = await spacesRes.json();

      setStats(overviewData);
      if (usersData.users) setUsersList(usersData.users);
      if (spacesData.spaces) setSpacesList(spacesData.spaces);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بارگذاری اطلاعات پنل مدیریت');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleChangeRole = async (userId: string, newRole: 'user' | 'admin' | 'super_admin') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-session-token': token,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        ambientAudio.playRippleTone(600);
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        const d = await res.json();
        alert(d.error || 'خطا در تغییر نقش');
      }
    } catch {
      alert('خطا در برقراری ارتباط');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`آیا از حذف حساب کاربری «${email}» اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-session-token': token,
        },
      });

      if (res.ok) {
        ambientAudio.playRippleTone(200);
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const d = await res.json();
        alert(d.error || 'خطا در حذف کاربر');
      }
    } catch {
      alert('خطا در برقراری ارتباط');
    }
  };

  const handleDeleteSpace = async (spaceId: string, name: string) => {
    if (!confirm(`آیا از حذف فضای «${name}» اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/admin/spaces/${spaceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-session-token': token,
        },
      });

      if (res.ok) {
        ambientAudio.playRippleTone(200);
        setSpacesList((prev) => prev.filter((s) => s.id !== spaceId));
      } else {
        const d = await res.json();
        alert(d.error || 'خطا در حذف فضا');
      }
    } catch {
      alert('خطا در حذف فضا');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcasting(true);
    setBroadcastSuccess(null);

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-session-token': token,
        },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          wave: broadcastWave,
          intensity: 1.0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        ambientAudio.playSignalResonance(1.0);
        setBroadcastSuccess(`پیام همگانی با موفقیت به ${data.reachedSpacesCount || 1} فضا ارسال شد.`);
        setBroadcastMessage('');
      } else {
        const d = await res.json();
        alert(d.error || 'خطا در ارسال پیام همگانی');
      }
    } catch {
      alert('خطا در ارسال');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleTestMySQL = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/test-mysql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-session-token': token,
        },
        body: JSON.stringify({
          host: testHost,
          port: testPort,
          user: testUser,
          password: testPassword,
          database: testDatabase,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        ambientAudio.playSignalResonance(0.8);
        setTestResult({
          success: true,
          message: `${data.message} (${data.version})`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'خطا در اتصال به دیتابیس MySQL',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'خطا در برقراری ارتباط با سرور',
      });
    } finally {
      setTestTesting(false);
    }
  };

  const handleDownloadSQL = () => {
    window.open('/api/admin/export/sql', '_blank');
    ambientAudio.playRippleTone(500);
  };

  const handleDownloadJSON = () => {
    window.open('/api/admin/export/json', '_blank');
    ambientAudio.playRippleTone(500);
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d} روز و ${h} ساعت`;
    if (h > 0) return `${h} ساعت و ${m} دقیقه`;
    return `${m} دقیقه و ${s} ثانیه`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-2xl ${
        isRtl ? 'rtl' : 'ltr'
      }`}
    >
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-amber-400/30 rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[94dvh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-light text-zinc-100">
                  {isRtl ? 'پنل مدیریت ارشد اسکالا' : 'SKALA Master Super Admin Panel'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono font-bold">
                  v2.0 • MySQL Ready
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-mono mt-0.5">
                {currentUserEmail || 'soraun.com@gmail.com'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-admin-refresh"
              onClick={fetchAdminData}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              title="بروزرسانی داده‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="btn-close-admin-panel"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close admin panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-3 sm:px-6 pt-2 sm:pt-3 gap-1 sm:gap-2 bg-zinc-900/60 overflow-x-auto no-scrollbar">
          <button
            id="tab-admin-overview"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 sm:pb-3 px-3 text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isRtl ? 'نمای کلی و سلامت سیستم' : 'Overview & Telemetry'}</span>
          </button>

          <button
            id="tab-admin-users"
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 sm:pb-3 px-3 text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isRtl ? 'مدیریت کاربران' : 'Users Management'} ({usersList.length})</span>
          </button>

          <button
            id="tab-admin-spaces"
            onClick={() => setActiveTab('spaces')}
            className={`pb-2.5 sm:pb-3 px-3 text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'spaces'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isRtl ? 'فضاها و حلقه‌ها' : 'Spaces & Circles'} ({spacesList.length})</span>
          </button>

          <button
            id="tab-admin-broadcast"
            onClick={() => setActiveTab('broadcast')}
            className={`pb-2.5 sm:pb-3 px-3 text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isRtl ? 'پخش کیهانی سراسری' : 'Cosmic Broadcast'}</span>
          </button>

          <button
            id="tab-admin-mysql"
            onClick={() => setActiveTab('mysql')}
            className={`pb-2.5 sm:pb-3 px-3 text-xs tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'mysql'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isRtl ? 'هاست لینوکس و پایگاه داده MySQL' : 'Linux Hosting & MySQL'}</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Active DB Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">{isRtl ? 'پایگاه داده فعال' : 'Database Engine'}</span>
                    <Database className={`w-4 h-4 ${stats?.mysqlConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-zinc-100">
                      {stats?.mysqlConnected ? 'MySQL / MariaDB' : 'دیسک لینوکس (JSON Pool)'}
                    </span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        stats?.mysqlConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono truncate">
                    {stats?.dbHost} / {stats?.dbName}
                  </span>
                </div>

                {/* Total Users */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">{isRtl ? 'کل کاربران واقعی' : 'Total Users'}</span>
                    <Users className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">{stats?.totalUsers ?? 0}</span>
                  <span className="text-[10px] text-zinc-500">
                    {usersList.filter((u) => u.role === 'admin' || u.role === 'super_admin').length} {isRtl ? 'مدیر سیستم' : 'Admins'}
                  </span>
                </div>

                {/* Total Circles */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">{isRtl ? 'فضاها و حلقه‌ها' : 'Spaces & Circles'}</span>
                    <Layers className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">{stats?.totalSpaces ?? 0}</span>
                  <span className="text-[10px] text-zinc-500">{stats?.activeOnlineUsers ?? 0} {isRtl ? 'حاضر آنلاین هم‌اکنون' : 'Online now'}</span>
                </div>

                {/* Push Subscriptions */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">{isRtl ? 'اعلان‌های فعال موبایل' : 'Push Subscriptions'}</span>
                    <Radio className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-2xl font-bold text-zinc-100">{stats?.totalPushSubscriptions ?? 0}</span>
                  <span className="text-[10px] text-zinc-500">{isRtl ? 'سرویس‌ورکر PWA' : 'PWA Subscribers'}</span>
                </div>
              </div>

              {/* Server Info Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-zinc-900/40 to-transparent border border-amber-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      {isRtl ? 'سرور یکپارچه نودجی‌اس و اکسپرس (Node.js Linux Backend)' : 'Node.js Linux Backend Engine'}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {isRtl ? 'مدت زمان فعالیت پیوسته:' : 'Server Uptime:'}{' '}
                      <strong className="text-amber-300 font-mono">{formatUptime(stats?.serverUptimeSeconds || 0)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="btn-download-quick-sql"
                    onClick={handleDownloadSQL}
                    className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'دانلود skala_database.sql' : 'Export SQL'}</span>
                  </button>
                  <button
                    id="btn-download-quick-json"
                    onClick={handleDownloadJSON}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'پشتیبان JSON' : 'Export JSON'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                  <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isRtl ? 'وضعیت دسترسی مدیر ارشد' : 'Super Admin Privileges'}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {isRtl
                      ? `حساب کاربری soraun.com@gmail.com به عنوان مدیر ارشد کل پلتفرم تعریف شده است و دارای دسترسی بدون محدودیت به مدیریت دیتابیس، ارتقای نقش کاربران، حذف فضاها و ارسال امواج کیهانی سراسری است.`
                      : 'The super admin account soraun.com@gmail.com has unrestricted access to user roles, database schema, space management, and real-time broadcasts.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
                  <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{isRtl ? 'معماری همگام‌سازی دوگانه' : 'Dual-Sync Persistence Architecture'}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {isRtl
                      ? `سیستم به گونه‌ای طراحی شده است که در صورت اتصال به MySQL تمام تراکنش‌ها روی جدول‌های MySQL ذخیره می‌شوند و در صورت قطع یا نبود دیتابیس، بلافاصله روی دیسک محلی لینوکس سوییچ کرده و هیچ داده‌ای از دست نمی‌رود.`
                      : 'Zero-downtime dual synchronization seamlessly stores in MySQL while retaining local high-speed file storage fallback.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. USERS MANAGEMENT TAB */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  {isRtl ? 'لیست کل کاربران ثبت‌نام‌شده در پلتفرم' : 'Registered Users in System'} ({usersList.length})
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {isRtl ? 'همگام با دیتابیس' : 'Synced with DB'}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {usersList.map((u) => {
                  const isSuper = u.role === 'super_admin' || u.email.toLowerCase() === 'soraun.com@gmail.com';
                  return (
                    <div
                      key={u.id}
                      id={`admin-user-row-${u.id}`}
                      className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                          <LivingOrb
                            color={u.color || { name: 'Cyan', primary: '#0ea5e9', glow: 'rgba(14,165,233,0.5)', ambient: 'rgba(14,165,233,0.1)', accent: '#38bdf8' }}
                            presence={(u.presence as any) || 'present'}
                            texture={(u.texture as any) || 'fluid'}
                            motionPersonality="meditative"
                            breathRate={4.5}
                            size={36}
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-100">{u.name}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                isSuper
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                  : u.role === 'admin'
                                  ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                                  : 'bg-white/5 text-zinc-400 border border-white/5'
                              }`}
                            >
                              {u.role === 'super_admin' ? 'Super Admin 👑' : u.role === 'admin' ? 'Admin 🛡️' : 'User'}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">{u.email}</span>
                          <span className="text-[10px] text-zinc-500 mt-0.5">
                            {isRtl ? 'عضویت:' : 'Joined:'} {new Date(u.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                      </div>

                      {/* User Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        {!isSuper && (
                          <>
                            <select
                              id={`select-role-${u.id}`}
                              value={u.role}
                              onChange={(e) => handleChangeRole(u.id, e.target.value as any)}
                              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-[11px] focus:outline-none focus:border-amber-400/50 cursor-pointer"
                            >
                              <option value="user">{isRtl ? 'کاربر عادی (User)' : 'User'}</option>
                              <option value="admin">{isRtl ? 'مدیر (Admin)' : 'Admin'}</option>
                              <option value="super_admin">{isRtl ? 'مدیر ارشد (Super Admin)' : 'Super Admin'}</option>
                            </select>

                            <button
                              id={`btn-delete-user-${u.id}`}
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                              title={isRtl ? 'حذف کاربر' : 'Delete User'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {isSuper && (
                          <span className="text-[10px] text-amber-300/80 px-2 py-1 bg-amber-400/10 rounded-lg">
                            {isRtl ? 'غیرقابل تغییر' : 'Protected Account'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. SPACES & CIRCLES TAB */}
          {activeTab === 'spaces' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  {isRtl ? 'حلقه‌ها و فضاهای فعال' : 'Active Spaces in Ecosystem'} ({spacesList.length})
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {spacesList.map((space) => {
                  const isMaster = space.id === 'main-cosmic-circle';
                  return (
                    <div
                      key={space.id}
                      id={`admin-space-row-${space.id}`}
                      className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-100">{space.name}</span>
                          {isMaster && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              {isRtl ? 'حلقه اصلی' : 'Master Sanctuary'}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                            {space.memberCount} {isRtl ? 'همراه حاضر' : 'Members'}
                          </span>
                        </div>
                        {space.description && (
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{space.description}</p>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {isRtl ? 'میزبان:' : 'Host:'} {space.hostName} ({space.hostEmail || 'بدون ایمیل'}) • ID: {space.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenSpace && (
                          <button
                            id={`btn-admin-enter-space-${space.id}`}
                            onClick={() => {
                              onOpenSpace(space.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 text-xs transition-colors cursor-pointer"
                          >
                            {isRtl ? 'ورود به فضا' : 'Enter Space'}
                          </button>
                        )}

                        {!isMaster && (
                          <button
                            id={`btn-delete-space-${space.id}`}
                            onClick={() => handleDeleteSpace(space.id, space.name)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                            title={isRtl ? 'حذف فضا' : 'Delete Space'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. BROADCAST TAB */}
          {activeTab === 'broadcast' && (
            <form onSubmit={handleSendBroadcast} className="flex flex-col gap-5">
              <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-start gap-3">
                <Radio className="w-5 h-5 text-amber-300 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-amber-300 block">
                    {isRtl ? 'ارسال پیام و امواج کیهانی سراسری' : 'Cosmic Omni-Broadcast'}
                  </span>
                  <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                    {isRtl
                      ? 'این پیام همزمان در تمام فضاها و برای تمام کاربران متصل ظاهر شده و در صورت داشتن نوتیفیکیشن موبایل، برای گوشی همراه آن‌ها ارسال می‌گردد.'
                      : 'Transmits instant real-time signals, visual pulses, and mobile push notifications to all connected participants across every circle.'}
                  </p>
                </div>
              </div>

              {broadcastSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{broadcastSuccess}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300">
                  {isRtl ? 'عنوان اطلاعیه' : 'Broadcast Title'}
                </label>
                <input
                  id="input-broadcast-title"
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="مثال: به‌روزرسانی سرور / پیام صلح کیهانی"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 transition-all placeholder:text-zinc-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300">
                  {isRtl ? 'متن پیام همگانی *' : 'Broadcast Message *'}
                </label>
                <textarea
                  id="input-broadcast-message"
                  required
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="متن اطلاعیه یا پیام نوری خود را برای تمامی کاربران تایپ کنید..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 transition-all placeholder:text-zinc-600 resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-widest text-zinc-400">
                  {isRtl ? 'نوع موج نوری ارسالی' : 'Wave Resonance Shape'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'radiant_burst', label: 'فوران تابناک 💥' },
                    { id: 'double_pulse', label: 'تپش دوگانه 💓' },
                    { id: 'starlit_flicker', label: 'سوسوی ستاره‌ای ✨' },
                    { id: 'deep_echo', label: 'پژواک عمیق 🌊' },
                    { id: 'soft_wave', label: 'موج نرم کیهانی 〰️' },
                    { id: 'steady_hum', label: 'زمزمه ممتد 🔆' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      id={`btn-wave-choice-${w.id}`}
                      onClick={() => setBroadcastWave(w.id as any)}
                      className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                        broadcastWave === w.id
                          ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-medium'
                          : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="btn-submit-broadcast"
                type="submit"
                disabled={broadcasting || !broadcastMessage.trim()}
                className="w-full py-3.5 rounded-2xl text-xs uppercase tracking-widest font-semibold bg-amber-400 hover:bg-amber-300 text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {broadcasting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isRtl ? 'ارسال همگانی به تمام فضاها' : 'Broadcast to All Spaces'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 5. LINUX HOSTING & MYSQL TAB */}
          {activeTab === 'mysql' && (
            <div className="flex flex-col gap-6">
              {/* Export Buttons Box */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>{isRtl ? 'دریافت اسکریپت دیتابیس MySQL برای phpMyAdmin' : 'MySQL Database SQL Export'}</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {isRtl
                      ? 'فایل skala_database.sql شامل ساختار تمام جداول (users, sessions, spaces, signals, push_subscriptions) و کاربر مدیر ارشد است.'
                      : 'Complete SQL script ready for phpMyAdmin import on Linux shared hosts (cPanel / DirectAdmin).'}
                  </p>
                </div>

                <button
                  id="btn-download-sql-file"
                  onClick={handleDownloadSQL}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>{isRtl ? 'دانلود skala_database.sql' : 'Download SQL Dump'}</span>
                </button>
              </div>

              {/* MySQL Live Connection Tester */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
                <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-300" />
                  <span>{isRtl ? 'تست زنده اتصال پایگاه داده MySQL هاست' : 'Live MySQL Database Connection Tester'}</span>
                </h3>

                <form onSubmit={handleTestMySQL} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-mono">DB_HOST</label>
                    <input
                      id="input-mysql-host"
                      type="text"
                      placeholder="localhost"
                      value={testHost}
                      onChange={(e) => setTestHost(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-mono">DB_PORT</label>
                    <input
                      id="input-mysql-port"
                      type="text"
                      placeholder="3306"
                      value={testPort}
                      onChange={(e) => setTestPort(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-mono">DB_NAME</label>
                    <input
                      id="input-mysql-dbname"
                      type="text"
                      placeholder="cpanel_skaladb"
                      value={testDatabase}
                      onChange={(e) => setTestDatabase(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-mono">DB_USER</label>
                    <input
                      id="input-mysql-user"
                      type="text"
                      placeholder="cpanel_user"
                      value={testUser}
                      onChange={(e) => setTestUser(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-mono">DB_PASSWORD</label>
                    <input
                      id="input-mysql-password"
                      type="password"
                      placeholder="••••••••"
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-100 text-xs font-mono focus:outline-none focus:border-amber-400/50"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      id="btn-test-mysql-conn"
                      type="submit"
                      disabled={testTesting}
                      className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                    >
                      {testTesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Activity className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'تست اتصال دیتابیس' : 'Test Connection'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 font-mono ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Step-by-Step Shared Hosting Guide */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3.5">
                <h3 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-300" />
                  <span>{isRtl ? 'راهنمای راه‌اندازی روی هاست اشتراکی لینوکس (cPanel / DirectAdmin)' : 'Linux Shared Hosting Setup Guide'}</span>
                </h3>

                <ol className="flex flex-col gap-2.5 text-xs text-zinc-300 leading-relaxed list-decimal list-inside pr-1">
                  <li>
                    <strong className="text-amber-300">ایجاد دیتابیس MySQL:</strong> در پنل هاست لینوکسی خود وارد بخش <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">MySQL Databases</code> شوید، یک دیتابیس و یک کاربر دیتابیس بسازید و تمام دسترسی‌ها (ALL PRIVILEGES) را به آن اختصاص دهید.
                  </li>
                  <li>
                    <strong className="text-amber-300">ایمپورت فایل SQL:</strong> وارد <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">phpMyAdmin</code> شوید، دیتابیس ساخته‌شده را انتخاب کنید و فایل <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">skala_database.sql</code> را در تب Import بارگذاری کنید.
                  </li>
                  <li>
                    <strong className="text-amber-300">فعال‌سازی Node.js App در cPanel:</strong> در cPanel به بخش <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">Setup Node.js App</code> بروید. نسخه Node.js را روی 18 یا 20 یا 22 قرار دهید.
                    <br />
                    - مسیر Application Root: <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-200">public_html</code> یا پوشه دلخواه
                    <br />
                    - فایل استارت (Application startup file): <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-200">dist/server.cjs</code> یا <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-200">server.ts</code>
                  </li>
                  <li>
                    <strong className="text-amber-300">تنظیم متغیرهای محیطی (.env):</strong> متغیرهای <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">DB_HOST=localhost</code>, <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">DB_USER</code>, <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">DB_PASSWORD</code>, <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">DB_NAME</code> را در بخش Environment Variables وارد کنید.
                  </li>
                  <li>
                    <strong className="text-amber-300">اجرای npm install و راه‌اندازی:</strong> دکمه <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">Run NPM Install</code> و سپس <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-200">Restart Application</code> را بزنید.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
