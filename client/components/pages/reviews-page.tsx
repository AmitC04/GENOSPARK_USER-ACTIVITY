import { useState, useEffect } from 'react';
import { ReviewCard } from '@/components/review-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star, BookOpen, CheckCircle2, Edit3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapStatus(s: string): 'Published' | 'Pending' | 'Draft' | 'Rejected' {
  if (s === 'pending')  return 'Pending';
  if (s === 'rejected') return 'Rejected';
  if (s === 'draft')    return 'Draft';
  return 'Published';
}

export function ReviewsPage() {
  const [reviews,      setReviews]      = useState<any[]>([]);
  const [enrollments,  setEnrollments]  = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy,       setSortBy]       = useState('recent');
  const [loading,      setLoading]      = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.reviews.getAll({ limit: 100 }),
      apiClient.enrollments.getAll({ limit: 100 }),
    ])
      .then(([revRes, enrRes]) => {
        setReviews(revRes.data?.data?.reviews         ?? []);
        setEnrollments(enrRes.data?.data?.enrollments ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reviewedCourseIds = new Set(reviews.map((r: any) => r.courseId ?? r.course?.id));
  const pendingReviews = enrollments.filter(
    (e: any) =>
      (e.status === 'active' || e.status === 'completed') &&
      !reviewedCourseIds.has(e.courseId ?? e.course?.id),
  );
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed');

  let displayed = reviews;
  if (statusFilter !== 'all') displayed = displayed.filter(r => mapStatus(r.status).toLowerCase() === statusFilter);

  if (sortBy === 'highest')      displayed = [...displayed].sort((a, b) => b.rating - a.rating);
  else if (sortBy === 'lowest')  displayed = [...displayed].sort((a, b) => a.rating - b.rating);
  else if (sortBy === 'helpful') displayed = [...displayed].sort((a, b) => (b.helpfulCount ?? 0) - (a.helpfulCount ?? 0));
  else displayed = [...displayed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#2c3e50', fontWeight: 'bold' }}>My Reviews & Ratings</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="published">Published Only</SelectItem>
            <SelectItem value="pending">Pending Moderation</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
            <SelectItem value="helpful">Most Helpful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading reviews…</div>
      ) : (
        <>
          {displayed.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <Star className="size-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl mb-2" style={{ color: '#2c3e50', fontWeight: 600 }}>No Reviews Yet</h3>
              <p className="text-gray-600 mb-6">Share your experience with courses you've completed!</p>
              <Button style={{ backgroundColor: '#3498db' }} onClick={() => setCompletedOpen(true)}>View Completed Courses</Button>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {displayed.map((review, i) => (
                <ReviewCard
                  key={review.id ?? i}
                  courseTitle={review.course?.title ?? 'Unknown Course'}
                  rating={review.rating}
                  submittedDate={formatDate(review.createdAt)}
                  status={mapStatus(review.status)}
                  content={review.content ?? ''}
                  helpfulCount={review.helpfulCount ?? 0}
                  replyCount={review.replyCount ?? 0}
                />
              ))}
            </div>
          )}

          {pendingReviews.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg" style={{ color: '#2c3e50', fontWeight: 600 }}>
                  Courses Awaiting Your Review
                </h3>
                <Button variant="outline" size="sm" onClick={() => setCompletedOpen(true)}>
                  <BookOpen className="size-4 mr-2" /> View All Completed
                </Button>
              </div>
              <div className="border-t pt-4 space-y-4">
                {pendingReviews.map((e: any, i: number) => (
                  <div key={e.id ?? i} className="flex items-center gap-4 p-4 rounded-lg border hover:border-blue-300 transition-colors">
                    <div className="size-16 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0">
                      {e.course?.thumbnail && (
                        <img src={e.course.thumbnail} alt={e.course?.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base mb-1" style={{ color: '#2c3e50', fontWeight: 600 }}>
                        {e.course?.title ?? 'Unknown Course'}
                      </h4>
                      {e.completedAt && (
                        <p className="text-sm text-gray-600">Completed: {formatDate(e.completedAt)}</p>
                      )}
                    </div>
                    <Button style={{ backgroundColor: '#3498db' }}>Write Review</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── View Completed Courses Dialog ────────────────────────── */}
      <Dialog open={completedOpen} onOpenChange={setCompletedOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CheckCircle2 className="size-5 text-green-400" /> Completed Courses
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-3">
            {completedEnrollments.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-sm">
                No completed courses yet. Keep learning! 🎓
              </div>
            ) : (
              completedEnrollments.map((e: any, i: number) => {
                const hasReview = reviewedCourseIds.has(e.courseId ?? e.course?.id);
                return (
                  <div key={e.id ?? i} className="flex items-center gap-3 bg-zinc-800 rounded-lg p-3">
                    <div className="size-12 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex-shrink-0">
                      {e.course?.thumbnail && (
                        <img src={e.course.thumbnail} alt={e.course?.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{e.course?.title ?? 'Unknown'}</p>
                      {e.completedAt && (
                        <p className="text-xs text-zinc-400">Completed: {formatDate(e.completedAt)}</p>
                      )}
                    </div>
                    {hasReview ? (
                      <Badge className="bg-green-700 text-green-100 text-xs flex-shrink-0">
                        <CheckCircle2 className="size-3 mr-1" /> Reviewed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-zinc-500 text-zinc-300 text-xs flex-shrink-0">
                        <Edit3 className="size-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
