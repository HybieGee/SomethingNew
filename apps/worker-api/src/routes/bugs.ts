import { Hono } from 'hono';
import { generateId } from '../shared/index';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';

export const bugRouter = new Hono<{ Bindings: Env }>();

// Submit bug report (no auth required)
bugRouter.post('/report', async (c) => {
  try {
    const body = await c.req.json();
    const {
      title,
      category,
      priority,
      description,
      steps,
      expected,
      actual,
      username,
      userId,
      email,
      browser,
      device,
      userAgent,
      url,
      timestamp
    } = body;

    // Basic validation
    if (!title || !description || !category) {
      return c.json({ error: 'Title, description, and category are required' }, 400);
    }

    const reportId = generateId();

    await c.env.DB.prepare(`
      INSERT INTO bug_reports (
        id, title, category, priority, description, steps, expected_behavior, actual_behavior,
        username, user_id, email, browser, device, user_agent, url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      reportId,
      title,
      category,
      priority || 'medium',
      description,
      steps || null,
      expected || null,
      actual || null,
      username || 'Anonymous',
      userId || null,
      email || null,
      browser || null,
      device || 'unknown',
      userAgent || null,
      url || null
    ).run();

    return c.json({
      success: true,
      message: 'Bug report submitted successfully',
      reportId
    });
  } catch (error: any) {
    console.error('Bug report submission error:', error);
    return c.json({ error: 'Failed to submit bug report', details: error.message }, 500);
  }
});

// Get all bug reports (admin only)
bugRouter.get('/admin/reports', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // Check if user is admin (you can customize this check)
    if (!user || user.username !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const status = c.req.query('status') || 'all';
    const category = c.req.query('category') || 'all';
    const priority = c.req.query('priority') || 'all';
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    let query = 'SELECT * FROM bug_reports WHERE 1=1';
    const params: any[] = [];

    if (status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (priority !== 'all') {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const reports = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM bug_reports WHERE 1=1';
    const countParams: any[] = [];

    if (status !== 'all') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (category !== 'all') {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (priority !== 'all') {
      countQuery += ' AND priority = ?';
      countParams.push(priority);
    }

    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();

    return c.json({
      success: true,
      reports: reports.results,
      pagination: {
        total: totalResult?.total || 0,
        limit,
        offset,
        hasMore: (totalResult?.total || 0) > offset + limit
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch bug reports:', error);
    return c.json({ error: 'Failed to fetch bug reports', details: error.message }, 500);
  }
});

// Update bug report status (admin only)
bugRouter.put('/admin/reports/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // Check if user is admin
    if (!user || user.username !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const reportId = c.req.param('id');
    const body = await c.req.json();
    const { status, adminNotes } = body;

    if (!status) {
      return c.json({ error: 'Status is required' }, 400);
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'duplicate'];
    if (!validStatuses.includes(status)) {
      return c.json({ error: 'Invalid status' }, 400);
    }

    const resolvedAt = status === 'resolved' || status === 'closed' ? new Date().toISOString() : null;

    await c.env.DB.prepare(`
      UPDATE bug_reports
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP, resolved_at = ?
      WHERE id = ?
    `).bind(status, adminNotes || null, resolvedAt, reportId).run();

    return c.json({
      success: true,
      message: 'Bug report updated successfully'
    });
  } catch (error: any) {
    console.error('Failed to update bug report:', error);
    return c.json({ error: 'Failed to update bug report', details: error.message }, 500);
  }
});

// Get single bug report (admin only)
bugRouter.get('/admin/reports/:id', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // Check if user is admin
    if (!user || user.username !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    const reportId = c.req.param('id');

    const report = await c.env.DB.prepare(`
      SELECT * FROM bug_reports WHERE id = ?
    `).bind(reportId).first();

    if (!report) {
      return c.json({ error: 'Bug report not found' }, 404);
    }

    return c.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('Failed to fetch bug report:', error);
    return c.json({ error: 'Failed to fetch bug report', details: error.message }, 500);
  }
});

// Get bug report statistics (admin only)
bugRouter.get('/admin/stats', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // Check if user is admin
    if (!user || user.username !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }

    // Get counts by status
    const statusStats = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM bug_reports
      GROUP BY status
    `).all();

    // Get counts by category
    const categoryStats = await c.env.DB.prepare(`
      SELECT category, COUNT(*) as count
      FROM bug_reports
      GROUP BY category
    `).all();

    // Get counts by priority
    const priorityStats = await c.env.DB.prepare(`
      SELECT priority, COUNT(*) as count
      FROM bug_reports
      GROUP BY priority
    `).all();

    // Get recent reports count (last 7 days)
    const recentReports = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM bug_reports
      WHERE created_at >= datetime('now', '-7 days')
    `).first<{ count: number }>();

    return c.json({
      success: true,
      stats: {
        byStatus: statusStats.results,
        byCategory: categoryStats.results,
        byPriority: priorityStats.results,
        recentCount: recentReports?.count || 0
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch bug report stats:', error);
    return c.json({ error: 'Failed to fetch stats', details: error.message }, 500);
  }
});