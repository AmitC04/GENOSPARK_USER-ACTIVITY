import { useState, useEffect } from 'react';
import { CourseCard } from '@/components/course-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Grid3x3, List, BookOpen } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapStatus(s: string): 'Active' | 'Completed' | 'Expired' {
  if (s === 'completed') return 'Completed';
  if (s === 'expired')   return 'Expired';
  return 'Active';
}

export function CoursesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy,   setSortBy]   = useState('recent');
  const [rawData,  setRawData]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    apiClient.enrollments
      .getAll({ limit: 100 })
      .then(res => setRawData(res.data?.data?.enrollments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toCardProps = (e: any) => ({
    title:        e.course?.title     ?? 'Unknown Course',
    thumbnail:    e.course?.thumbnail ?? '',
    progress:     e.progress          ?? 0,
    enrolledDate: formatDate(e.enrolledAt),
    status:       mapStatus(e.status),
    expiryDate:   e.expiresAt ? formatDate(e.expiresAt) : undefined,
  });

  const sorted = (list: any[]) => {
    const copy = [...list];
    if (sortBy === 'name')     return copy.sort((a, b) => (a.course?.title ?? '').localeCompare(b.course?.title ?? ''));
    if (sortBy === 'progress') return copy.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    if (sortBy === 'expiry')   return copy.sort((a, b) => new Date(a.expiresAt ?? 0).getTime() - new Date(b.expiresAt ?? 0).getTime());
    return copy.sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());
  };

  const active    = sorted(rawData.filter(e => e.status === 'active'));
  const completed = sorted(rawData.filter(e => e.status === 'completed'));
  const expired   = sorted(rawData.filter(e => e.status === 'expired'));
  const allCourses = sorted(rawData);

  const gridClass = viewMode === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'space-y-4';

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-500">Loading courses…</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#2c3e50', fontWeight: 'bold' }}>My Courses</h1>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({allCourses.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({expired.length})</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="progress">Progress (High to Low)</SelectItem>
                <SelectItem value="expiry">Expiry Date</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-lg overflow-hidden">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}><Grid3x3 className="size-4" /></Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')}><List    className="size-4" /></Button>
            </div>
          </div>
        </div>

        {(['all', 'active', 'completed'] as const).map(tab => {
          const list = tab === 'all' ? allCourses : tab === 'active' ? active : completed;
          return (
            <TabsContent key={tab} value={tab}>
              {list.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <BookOpen className="size-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl mb-2" style={{ color: '#2c3e50', fontWeight: 600 }}>No Courses Found</h3>
                </div>
              ) : (
                <div className={gridClass}>
                  {list.map((e, i) => <CourseCard key={e.id ?? i} {...toCardProps(e)} />)}
                </div>
              )}
            </TabsContent>
          );
        })}

        <TabsContent value="expired">
          {expired.length > 0 ? (
            <div className={gridClass}>
              {expired.map((e, i) => <CourseCard key={e.id ?? i} {...toCardProps(e)} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <BookOpen className="size-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl mb-2" style={{ color: '#2c3e50', fontWeight: 600 }}>No Expired Courses</h3>
              <p className="text-gray-600 mb-6">All your courses are up to date!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
