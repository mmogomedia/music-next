/**
 * Stats Aggregation Jobs
 * Handles time-based aggregation of stats data for performance optimization
 */

import { prisma } from './db';

export interface DailyStatsData {
  trackId: string;
  date: Date;
  totalPlays: number;
  uniquePlays: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  totalSaves: number;
  avgDuration: number;
  avgCompletionRate: number;
  skipRate: number;
  replayRate: number;
}

export interface WeeklyStatsData {
  trackId: string;
  weekStart: Date;
  totalPlays: number;
  uniquePlays: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  totalSaves: number;
  avgDuration: number;
  avgCompletionRate: number;
  skipRate: number;
  replayRate: number;
}

export interface MonthlyStatsData {
  trackId: string;
  monthStart: Date;
  totalPlays: number;
  uniquePlays: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  totalSaves: number;
  avgDuration: number;
  avgCompletionRate: number;
  skipRate: number;
  replayRate: number;
}

export interface YearlyStatsData {
  trackId: string;
  year: number;
  totalPlays: number;
  uniquePlays: number;
  totalLikes: number;
  totalShares: number;
  totalDownloads: number;
  totalSaves: number;
  avgDuration: number;
  avgCompletionRate: number;
  skipRate: number;
  replayRate: number;
}

export class StatsAggregator {
  /**
   * Aggregate daily stats for a specific date
   */
  async aggregateDaily(date: Date): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
      // Get all tracks that had activity on this date
      const tracksWithActivity = await prisma.track.findMany({
        where: {
          OR: [
            {
              playEvents: {
                some: {
                  timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                  },
                },
              },
            },
            {
              likeEvents: {
                some: {
                  timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                  },
                },
              },
            },
            {
              shareEvents: {
                some: {
                  timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                  },
                },
              },
            },
            {
              downloadEvents: {
                some: {
                  timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                  },
                },
              },
            },
          ],
        },
        select: { id: true },
      });

      for (const track of tracksWithActivity) {
        await this.aggregateTrackDaily(track.id, startOfDay, endOfDay);
      }
    } catch (error) {
      console.error('Error in daily aggregation:', error);
      throw error;
    }
  }

  /**
   * Aggregate stats for a specific track on a specific date
   */
  private async aggregateTrackDaily(
    trackId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<void> {
    // Play events
    const playEvents = await prisma.playEvent.findMany({
      where: {
        trackId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Like events
    const likeEvents = await prisma.likeEvent.findMany({
      where: {
        trackId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Share events
    const shareEvents = await prisma.shareEvent.findMany({
      where: {
        trackId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Download events
    const downloadEvents = await prisma.downloadEvent.findMany({
      where: {
        trackId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Save events
    const saveEvents = await prisma.saveEvent.findMany({
      where: {
        trackId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Calculate metrics
    const totalPlays = playEvents.length;
    const uniquePlays = new Set(playEvents.map(e => e.sessionId)).size;
    const totalLikes = likeEvents.filter(e => e.action === 'like').length;
    const totalShares = shareEvents.length;
    const totalDownloads = downloadEvents.length;
    const totalSaves = saveEvents.filter(e => e.action === 'save').length;

    // Calculate averages
    const durations = playEvents.filter(e => e.duration).map(e => e.duration!);
    const completionRates = playEvents
      .filter(e => e.completionRate)
      .map(e => e.completionRate!);

    const avgDuration =
      durations.length > 0
        ? durations.reduce((sum, duration) => sum + duration, 0) /
          durations.length
        : 0;

    const avgCompletionRate =
      completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) /
          completionRates.length
        : 0;

    // Calculate rates
    const skipRate =
      totalPlays > 0
        ? (playEvents.filter(e => e.skipped).length / totalPlays) * 100
        : 0;
    const replayRate =
      totalPlays > 0
        ? (playEvents.filter(e => e.replayed).length / totalPlays) * 100
        : 0;

    // Store or update daily stats
    await prisma.dailyStats.upsert({
      where: {
        trackId_date: {
          trackId,
          date: startOfDay,
        },
      },
      update: {
        totalPlays,
        uniquePlays,
        totalLikes,
        totalShares,
        totalDownloads,
        totalSaves,
        avgDuration,
        avgCompletionRate,
        skipRate,
        replayRate,
      },
      create: {
        trackId,
        date: startOfDay,
        totalPlays,
        uniquePlays,
        totalLikes,
        totalShares,
        totalDownloads,
        totalSaves,
        avgDuration,
        avgCompletionRate,
        skipRate,
        replayRate,
      },
    });
  }

  /**
   * Aggregate weekly stats from daily stats
   */
  async aggregateWeekly(weekStart: Date): Promise<void> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    try {
      // Get all tracks that have daily stats in this week
      const tracksWithStats = await prisma.dailyStats.findMany({
        where: {
          date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        select: { trackId: true },
        distinct: ['trackId'],
      });

      for (const track of tracksWithStats) {
        await this.aggregateTrackWeekly(track.trackId, weekStart, weekEnd);
      }
    } catch (error) {
      console.error('Error in weekly aggregation:', error);
      throw error;
    }
  }

  /**
   * Aggregate stats for a specific track for a week
   */
  private async aggregateTrackWeekly(
    trackId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<void> {
    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        trackId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    if (dailyStats.length === 0) return;

    // Sum up all daily stats
    const totalPlays = dailyStats.reduce(
      (sum, stat) => sum + stat.totalPlays,
      0
    );
    const uniquePlays = dailyStats.reduce(
      (sum, stat) => sum + stat.uniquePlays,
      0
    );
    const totalLikes = dailyStats.reduce(
      (sum, stat) => sum + stat.totalLikes,
      0
    );
    const totalShares = dailyStats.reduce(
      (sum, stat) => sum + stat.totalShares,
      0
    );
    const totalDownloads = dailyStats.reduce(
      (sum, stat) => sum + stat.totalDownloads,
      0
    );
    const totalSaves = dailyStats.reduce(
      (sum, stat) => sum + stat.totalSaves,
      0
    );

    // Calculate weighted averages
    const totalPlayDuration = dailyStats.reduce(
      (sum, stat) => sum + stat.avgDuration * stat.totalPlays,
      0
    );
    const avgDuration = totalPlays > 0 ? totalPlayDuration / totalPlays : 0;

    const totalCompletionDuration = dailyStats.reduce(
      (sum, stat) => sum + stat.avgCompletionRate * stat.totalPlays,
      0
    );
    const avgCompletionRate =
      totalPlays > 0 ? totalCompletionDuration / totalPlays : 0;

    const totalSkipDuration = dailyStats.reduce(
      (sum, stat) => sum + stat.skipRate * stat.totalPlays,
      0
    );
    const skipRate = totalPlays > 0 ? totalSkipDuration / totalPlays : 0;

    const totalReplayDuration = dailyStats.reduce(
      (sum, stat) => sum + stat.replayRate * stat.totalPlays,
      0
    );
    const replayRate = totalPlays > 0 ? totalReplayDuration / totalPlays : 0;

    // Store or update weekly stats
    await prisma.weeklyStats.upsert({
      where: {
        trackId_weekStart: {
          trackId,
          weekStart,
        },
      },
      update: {
        totalPlays,
        uniquePlays,
        totalLikes,
        totalShares,
        totalDownloads,
        totalSaves,
        avgDuration,
        avgCompletionRate,
        skipRate,
        replayRate,
      },
      create: {
        trackId,
        weekStart,
        totalPlays,
        uniquePlays,
        totalLikes,
        totalShares,
        totalDownloads,
        totalSaves,
        avgDuration,
        avgCompletionRate,
        skipRate,
        replayRate,
      },
    });
  }

  /**
   * Aggregate monthly stats from weekly stats
   */
  async aggregateMonthly(monthStart: Date): Promise<void> {
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0); // Last day of the month
    monthEnd.setHours(23, 59, 59, 999);

    try {
      // Get all tracks that have weekly stats in this month
      const tracksWithStats = await prisma.weeklyStats.findMany({
        where: {
          weekStart: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: { trackId: true },
        distinct: ['trackId'],
      });

      for (const track of tracksWithStats) {
        await this.aggregateTrackMonthly(track.trackId, monthStart, monthEnd);
      }
    } catch (error) {
      console.error('Error in monthly aggregation:', error);
      throw error;
    }
  }

  /**
   * Aggregate stats for a specific track for a month
   */
  private async aggregateTrackMonthly(
    trackId: string,
    monthStart: Date,
    monthEnd: Date
  ): Promise<void> {
    const weeklyStats = await prisma.weeklyStats.findMany({
      where: {
        trackId,
        weekStart: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    if (weeklyStats.length === 0) return;

    // Sum up all weekly stats
    const totalPlays = weeklyStats.reduce(
      (sum, stat) => sum + stat.totalPlays,
      0
    );
    const uniquePlays = weeklyStats.reduce(
      (sum, stat) => sum + stat.uniquePlays,
      0
    );
    const totalLikes = weeklyStats.reduce(
      (sum, stat) => sum + stat.totalLikes,
      0
    );
    const totalShares = weeklyStats.reduce(
      (sum, stat) => sum + stat.totalShares,
      0
    );
    const totalDownloads = weeklyStats.reduce(
      (sum, stat) => sum + stat.totalDownloads,
      0
    );
    const totalSaves = weeklyStats.reduce(
      (sum, stat) => sum + stat.totalSaves,
      0
    );

    // Calculate weighted averages
    const totalPlayDuration = weeklyStats.reduce(
      (sum, stat) => sum + stat.avgDuration * stat.totalPlays,
      0
    );
    const avgDuration = totalPlays > 0 ? totalPlayDuration / totalPlays : 0;

    const totalCompletionDuration = weeklyStats.reduce(
      (sum, stat) => sum + stat.avgCompletionRate * stat.totalPlays,
      0
    );
    const avgCompletionRate =
      totalPlays > 0 ? totalCompletionDuration / totalPlays : 0;

    const totalSkipDuration = weeklyStats.reduce(
      (sum, stat) => sum + stat.skipRate * stat.totalPlays,
      0
    );
    const skipRate = totalPlays > 0 ? totalSkipDuration / totalPlays : 0;

    const totalReplayDuration = weeklyStats.reduce(
      (sum, stat) => sum + stat.replayRate * stat.totalPlays,
      0
    );
    const replayRate = totalPlays > 0 ? totalReplayDuration / totalPlays : 0;

    // Store or update monthly stats
    await prisma.monthlyStats.upsert({
      where: {
        trackId_monthStart: {
          trackId,
          monthStart,
        },
      },
      update: {
        totalPlays,
        uniquePlays,
        totalLikes,
        totalShares,
        totalDownloads,
        totalSaves,
        avgDuration,
        avgCompletionRate,
        skipRate,
        replayRate,
      },
      create: {
        trackId,
        monthStart,
        totalPlays,
        uniquePlays,
        totalLikes,
        totalShares,
        totalDownloads,
        totalSaves,
        avgDuration,
        avgCompletionRate,
        skipRate,
        replayRate,
      },
    });
  }

  /**
   * Aggregate yearly stats from monthly stats
   */
  async aggregateYearly(year: number): Promise<void> {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    try {
      // Get all tracks that have monthly stats in this year
      const tracksWithStats = await prisma.monthlyStats.findMany({
        where: {
          monthStart: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        select: { trackId: true },
        distinct: ['trackId'],
      });

      for (const track of tracksWithStats) {
        await this.aggregateTrackYearly(track.trackId, yearStart, yearEnd);
      }
    } catch (error) {
      console.error('Error in yearly aggregation:', error);
      throw error;
    }
  }

  /**
   * Aggregate stats for a specific track for a year
   */
  private async aggregateTrackYearly(
    trackId: string,
    yearStart: Date,
    yearEnd: Date
  ): Promise<void> {
    const year = yearStart.getFullYear();
    const monthlyStats = await prisma.monthlyStats.findMany({
      where: {
        trackId,
        monthStart: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });

    if (monthlyStats.length === 0) return;

    // Sum up all monthly stats
    const totalPlays = monthlyStats.reduce(
      (sum, stat) => sum + stat.totalPlays,
      0
    );
    const uniquePlays = monthlyStats.reduce(
      (sum, stat) => sum + stat.uniquePlays,
      0
    );
    const totalLikes = monthlyStats.reduce(
      (sum, stat) => sum + stat.totalLikes,
      0
    );
    const totalShares = monthlyStats.reduce(
      (sum, stat) => sum + stat.totalShares,
      0
    );
    const totalDownloads = monthlyStats.reduce(
      (sum, stat) => sum + stat.totalDownloads,
      0
    );
    const totalSaves = monthlyStats.reduce(
      (sum, stat) => sum + stat.totalSaves,
      0
    );

    // Calculate weighted averages
    const totalPlayDuration = monthlyStats.reduce(
      (sum, stat) => sum + stat.avgDuration * stat.totalPlays,
      0
    );
    const avgDuration = totalPlays > 0 ? totalPlayDuration / totalPlays : 0;

    const totalCompletionDuration = monthlyStats.reduce(
      (sum, stat) => sum + stat.avgCompletionRate * stat.totalPlays,
      0
    );
    const avgCompletionRate =
      totalPlays > 0 ? totalCompletionDuration / totalPlays : 0;

    const totalSkipDuration = monthlyStats.reduce(
      (sum, stat) => sum + stat.skipRate * stat.totalPlays,
      0
    );
    const skipRate = totalPlays > 0 ? totalSkipDuration / totalPlays : 0;

    const totalReplayDuration = monthlyStats.reduce(
      (sum, stat) => sum + stat.replayRate * stat.totalPlays,
      0
    );
    const replayRate = totalPlays > 0 ? totalReplayDuration / totalPlays : 0;

    // Store or update yearly stats
    await prisma.yearlyStats.upsert({
      where: {
        trackId_year: {
          trackId,
          year,
        },
      },
      update: {
        totalPlays,
        uniquePlays,
        totalLikes,
        totalShares,
        totalDownloads,
        totalSaves,
        avgDuration,
        avgCompletionRate,
        skipRate,
        replayRate,
      },
      create: {
        trackId,
        year,
        totalPlays,
        uniquePlays,
        totalLikes,
        totalShares,
        totalDownloads,
        totalSaves,
        avgDuration,
        avgCompletionRate,
        skipRate,
        replayRate,
      },
    });
  }

  /**
   * Run all aggregations for a specific date
   */
  async runAllAggregations(date: Date): Promise<void> {
    try {
      // Daily aggregation
      await this.aggregateDaily(date);

      // Weekly aggregation (if it's the start of a new week)
      const weekStart = this.getWeekStart(date);
      if (weekStart.getTime() === date.getTime()) {
        await this.aggregateWeekly(weekStart);
      }

      // Monthly aggregation (if it's the start of a new month)
      const monthStart = this.getMonthStart(date);
      if (monthStart.getTime() === date.getTime()) {
        await this.aggregateMonthly(monthStart);
      }

      // Yearly aggregation (if it's the start of a new year)
      const yearStart = this.getYearStart(date);
      if (yearStart.getTime() === date.getTime()) {
        await this.aggregateYearly(date.getFullYear());
      }
    } catch (error) {
      console.error('Error in runAllAggregations:', error);
      throw error;
    }
  }

  /**
   * Helper methods to get period starts
   */
  getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  getMonthStart(date: Date): Date {
    const monthStart = new Date(date);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return monthStart;
  }

  getYearStart(date: Date): Date {
    const yearStart = new Date(date);
    yearStart.setMonth(0, 1);
    yearStart.setHours(0, 0, 0, 0);
    return yearStart;
  }
}

// Export singleton instance
export const statsAggregator = new StatsAggregator();
