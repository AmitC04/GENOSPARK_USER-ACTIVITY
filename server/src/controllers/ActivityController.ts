import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { ResponseHandler } from '../utils/responseHandler';

// ─── Constants ────────────────────────────────────────────────────────────────

export const ACTIVITY_TYPES = [
  'login',
  'registration',
  'password_changed',
  'profile_updated',
  'email_updated',
  'course_enrolled',
  'course_completed',
  'order_placed',
  'review_submitted',
] as const;

export type ActivityType = typeof ACTIVITY_TYPES[number];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ─── Typed where clause ───────────────────────────────────────────────────────

type ActivityWhereInput = Prisma.ActivityWhereInput;

// ─── Controller ───────────────────────────────────────────────────────────────

export class ActivityController {
  static async getUserActivities(req: Request, res: Response) {
    try {
      const userId = req.userId as string;

      const rawPage  = parseInt(String(req.query.page  ?? '1'),  10);
      const rawLimit = parseInt(String(req.query.limit ?? String(DEFAULT_PAGE_SIZE)), 10);
      const typeParam = req.query.type as string | undefined;

      const page  = isNaN(rawPage)  || rawPage  < 1 ? 1 : rawPage;
      const limit = isNaN(rawLimit) || rawLimit < 1 ? DEFAULT_PAGE_SIZE
                  : rawLimit > MAX_PAGE_SIZE         ? MAX_PAGE_SIZE
                  : rawLimit;
      const skip  = (page - 1) * limit;

      // Validate type enum if provided
      if (typeParam && !(ACTIVITY_TYPES as readonly string[]).includes(typeParam)) {
        return ResponseHandler.badRequest(
          res,
          `Invalid activity type. Allowed: ${ACTIVITY_TYPES.join(', ')}`,
        );
      }

      const where: ActivityWhereInput = { userId };
      if (typeParam) where.type = typeParam;

      const [activities, total] = await prisma.$transaction([
        prisma.activity.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.activity.count({ where }),
      ]);

      return ResponseHandler.success(
        res,
        { activities, pagination: { page, limit, total } },
        'Activities retrieved successfully',
      );
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Get activities error:', error);
      return ResponseHandler.internalError(res, 'Failed to fetch activities');
    }
  }

  /**
   * Fixes race condition: authorization is baked into the WHERE clause so the
   * find and update happen atomically — no stale-read window.
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const activityId = req.params.activityId as string;
      const userId     = req.userId as string;

      if (!activityId || typeof activityId !== 'string') {
        return ResponseHandler.badRequest(res, 'Invalid activity ID');
      }

      // Single query: only updates if the activity belongs to this user
      const updated = await prisma.activity.updateMany({
        where: { id: activityId, userId },
        data:  { isRead: true },
      });

      if (updated.count === 0) {
        return ResponseHandler.forbidden(res, 'Activity not found or not authorized');
      }

      return ResponseHandler.success(res, { activityId, isRead: true }, 'Activity marked as read');
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Mark as read error:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return ResponseHandler.notFound(res, 'Activity not found');
      }
      return ResponseHandler.internalError(res);
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.userId as string;

      const result = await prisma.activity.updateMany({
        where: { userId, isRead: false },
        data:  { isRead: true },
      });

      return ResponseHandler.success(
        res,
        { updatedCount: result.count },
        'All activities marked as read',
      );
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Mark all read error:', error);
      return ResponseHandler.internalError(res);
    }
  }

  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.userId as string;

      const count = await prisma.activity.count({
        where: { userId, isRead: false },
      });

      return ResponseHandler.success(res, { unreadCount: count }, 'Unread count retrieved');
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Get unread count error:', error);
      return ResponseHandler.internalError(res);
    }
  }
}
