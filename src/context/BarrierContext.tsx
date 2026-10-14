import React, { createContext, useState, useEffect, useCallback } from 'react';
import type {
  BarrierReport,
  Route,
  CommunityInsight,
  Severity,
  BarrierCategory,
  VerificationStatus,
  ActivityLogEntry,
  PotentialDuplicateMatch,
} from '../types/models';
import { DEMO_BARRIERS, DEMO_ROUTES, DEMO_INSIGHTS } from '../data/demo';

export interface BarrierContextType {
  barriers: BarrierReport[];
  routes: Route[];
  insights: CommunityInsight[];
  myReports: BarrierReport[];
  selectedRoute: string | null;
  setSelectedRoute: (id: string | null) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedSeverity: string;
  setSelectedSeverity: (s: string) => void;
  isLoading: boolean;
  serverError: string | null;
  activityTimeline: ActivityLogEntry[];
  metrics: {
    total: number;
    unresolved: number;
    highPriority: number;
    resolved: number;
    resolutionRate: number;
  };
  addBarrier: (newReport: {
    title: string;
    description: string;
    category: BarrierCategory;
    severity: Severity;
    address: string;
    lat?: number;
    lng?: number;
    imageUrl?: string;
    duplicateOf?: string | null;
    aiAnalysis?: any;
    reportedBy?: string;
  }) => Promise<BarrierReport>;
  updateBarrierStatus: (
    id: string,
    newStatus: VerificationStatus,
    note?: string,
    actor?: string
  ) => Promise<BarrierReport | null>;
  assignBarrierTeam: (id: string, team: string, note?: string) => Promise<BarrierReport | null>;
  linkDuplicateBarrier: (childId: string, parentId: string) => Promise<boolean>;
  upvoteBarrier: (id: string) => void;
  resetToSeedData: () => Promise<void>;
  checkDuplicates: (candidate: {
    title: string;
    description: string;
    category?: string;
    address?: string;
    lat?: number;
    lng?: number;
  }) => Promise<PotentialDuplicateMatch[]>;
  addInsight: (insight: {
    title: string;
    content: string;
    author: string;
    tags: string[];
    category: CommunityInsight['category'];
  }) => void;
  likeInsight: (id: string) => void;
}

export const BarrierContext = createContext<BarrierContextType | null>(null);

export const BarrierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [barriers, setBarriers] = useState<BarrierReport[]>(() => {
    try {
      const saved = localStorage.getItem('civiclens_issues') || localStorage.getItem('pathable_barriers');
      return saved ? JSON.parse(saved) : DEMO_BARRIERS;
    } catch {
      return DEMO_BARRIERS;
    }
  });

  const [myReports, setMyReports] = useState<BarrierReport[]>(() => {
    try {
      const saved = localStorage.getItem('civiclens_my_reports') || localStorage.getItem('pathable_my_reports');
      return saved ? JSON.parse(saved) : DEMO_BARRIERS.slice(0, 2);
    } catch {
      return DEMO_BARRIERS.slice(0, 2);
    }
  });

  const [insights, setInsights] = useState<CommunityInsight[]>(() => {
    try {
      const saved = localStorage.getItem('civiclens_insights') || localStorage.getItem('pathable_insights');
      return saved ? JSON.parse(saved) : DEMO_INSIGHTS;
    } catch {
      return DEMO_INSIGHTS;
    }
  });

  const [activityTimeline, setActivityTimeline] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const [routes] = useState<Route[]>(DEMO_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Fetch initial issues & activity timeline from server database
  const refreshIssuesFromServer = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/issues?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.issues) && data.issues.length > 0) {
          setBarriers(data.issues);
          localStorage.setItem('civiclens_issues', JSON.stringify(data.issues));
        }
      }

      // Fetch global activity timeline
      const actRes = await fetch('/api/activity?limit=25');
      if (actRes.ok) {
        const actData = await actRes.json();
        if (actData.success && Array.isArray(actData.events)) {
          setActivityTimeline(actData.events);
        }
      }
      setServerError(null);
    } catch (err: any) {
      console.warn('Could not contact /api/issues; relying on local storage cache:', err);
      setServerError('Running in offline/local cache mode.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshIssuesFromServer();
  }, [refreshIssuesFromServer]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('civiclens_issues', JSON.stringify(barriers));
    } catch (e) {
      console.warn('Could not save issues to localStorage:', e);
    }
  }, [barriers]);

  useEffect(() => {
    try {
      localStorage.setItem('civiclens_my_reports', JSON.stringify(myReports));
    } catch (e) {
      console.warn('Could not save my reports:', e);
    }
  }, [myReports]);

  // Calculated Real-Time Metrics
  const metrics = {
    total: barriers.length,
    unresolved: barriers.filter((b) => b.status !== 'resolved').length,
    highPriority: barriers.filter(
      (b) => b.severity === 'critical' || b.severity === 'high' || (b.priorityScore || 0) >= 60
    ).length,
    resolved: barriers.filter((b) => b.status === 'resolved').length,
    resolutionRate: Math.round(
      (barriers.filter((b) => b.status === 'resolved').length / (barriers.length || 1)) * 100
    ),
  };

  // Add Issue
  const addBarrier = async (data: {
    title: string;
    description: string;
    category: BarrierCategory;
    severity: Severity;
    address: string;
    lat?: number;
    lng?: number;
    imageUrl?: string;
    duplicateOf?: string | null;
    aiAnalysis?: any;
    reportedBy?: string;
  }): Promise<BarrierReport> => {
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.issue) {
          setBarriers((prev) => [json.issue, ...prev]);
          setMyReports((prev) => [json.issue, ...prev]);
          refreshIssuesFromServer();
          return json.issue;
        }
      }
    } catch (err) {
      console.warn('Server POST /api/issues failed; falling back to client-side persistence:', err);
    }

    // Fallback local creation
    const newReport: BarrierReport = {
      id: `iss-${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: data.duplicateOf ? 'duplicate' : 'pending',
      priorityScore: data.severity === 'critical' ? 88 : data.severity === 'high' ? 72 : 50,
      priorityLevel: data.severity,
      location: {
        lat: data.lat ?? (17.4435 + (Math.random() - 0.5) * 0.01),
        lng: data.lng ?? (78.3772 + (Math.random() - 0.5) * 0.01),
        address: data.address,
      },
      reportedBy: data.reportedBy || 'You (Civic Contributor)',
      reportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 1,
      imageUrl: data.imageUrl,
      duplicateOf: data.duplicateOf || null,
      duplicateIds: [],
      aiAnalysis: data.aiAnalysis,
      isSampleData: false,
      activityLog: [
        {
          id: `act-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'created',
          actor: data.reportedBy || 'You (Civic Contributor)',
          details: 'Report created locally.',
        },
      ],
    };

    setBarriers((prev) => [newReport, ...prev]);
    setMyReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  // Update Status
  const updateBarrierStatus = async (
    id: string,
    newStatus: VerificationStatus,
    note?: string,
    actor: string = 'Municipal Reviewer'
  ): Promise<BarrierReport | null> => {
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note, actor }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.issue) {
          setBarriers((prev) => prev.map((b) => (b.id === id ? json.issue : b)));
          setMyReports((prev) => prev.map((b) => (b.id === id ? json.issue : b)));
          refreshIssuesFromServer();
          return json.issue;
        }
      }
    } catch (err) {
      console.warn('Server PATCH /api/issues failed; updating locally:', err);
    }

    // Local fallback
    let updatedReport: BarrierReport | null = null;
    setBarriers((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          const logEntry: ActivityLogEntry = {
            id: `act-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'status_changed',
            actor,
            details: note || `Status updated from ${b.status} to ${newStatus}.`,
            previousValue: b.status,
            newValue: newStatus,
          };
          updatedReport = {
            ...b,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            activityLog: [logEntry, ...(b.activityLog || [])],
          };
          return updatedReport;
        }
        return b;
      })
    );
    return updatedReport;
  };

  // Assign Team
  const assignBarrierTeam = async (
    id: string,
    team: string,
    note?: string
  ): Promise<BarrierReport | null> => {
    try {
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTeam: team, note }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.issue) {
          setBarriers((prev) => prev.map((b) => (b.id === id ? json.issue : b)));
          return json.issue;
        }
      }
    } catch (err) {
      console.warn('Team assignment update failed:', err);
    }

    let updated: BarrierReport | null = null;
    setBarriers((prev) =>
      prev.map((b) => {
        if (b.id === id) {
          updated = { ...b, assignedTeam: team, updatedAt: new Date().toISOString() };
          return updated;
        }
        return b;
      })
    );
    return updated;
  };

  // Link Duplicate
  const linkDuplicateBarrier = async (childId: string, parentId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/issues/${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateOf: parentId }),
      });
      if (res.ok) {
        refreshIssuesFromServer();
        return true;
      }
    } catch (err) {
      console.warn('Duplicate link failed:', err);
    }

    setBarriers((prev) =>
      prev.map((b) => {
        if (b.id === childId) {
          return { ...b, status: 'duplicate', duplicateOf: parentId };
        }
        if (b.id === parentId) {
          const ids = b.duplicateIds || [];
          return { ...b, duplicateIds: ids.includes(childId) ? ids : [...ids, childId] };
        }
        return b;
      })
    );
    return true;
  };

  // Upvote
  const upvoteBarrier = (id: string) => {
    fetch(`/api/issues/${id}/upvote`, { method: 'POST' }).catch(() => {});
    setBarriers((prev) =>
      prev.map((b) => (b.id === id ? { ...b, upvotes: b.upvotes + 1 } : b))
    );
    setMyReports((prev) =>
      prev.map((b) => (b.id === id ? { ...b, upvotes: b.upvotes + 1 } : b))
    );
  };

  // Check Duplicates
  const checkDuplicates = async (candidate: {
    title: string;
    description: string;
    category?: string;
    address?: string;
    lat?: number;
    lng?: number;
  }): Promise<PotentialDuplicateMatch[]> => {
    try {
      const res = await fetch('/api/issues/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      });
      if (res.ok) {
        const data = await res.json();
        return data.potentialDuplicates || [];
      }
    } catch (err) {
      console.warn('Server duplicate check failed:', err);
    }
    return [];
  };

  // Reset to Seed
  const resetToSeedData = async () => {
    try {
      const res = await fetch('/api/issues/reset-seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.issues) {
          setBarriers(data.issues);
          localStorage.setItem('civiclens_issues', JSON.stringify(data.issues));
        }
      }
    } catch {
      setBarriers(DEMO_BARRIERS);
    }
    refreshIssuesFromServer();
  };

  const addInsight = (data: {
    title: string;
    content: string;
    author: string;
    tags: string[];
    category: CommunityInsight['category'];
  }) => {
    const newInsight: CommunityInsight = {
      id: `ins-${Date.now()}`,
      title: data.title,
      content: data.content,
      author: data.author || 'Civic Navigator',
      createdAt: new Date().toISOString(),
      likes: 1,
      tags: data.tags,
      category: data.category,
    };
    setInsights((prev) => [newInsight, ...prev]);
  };

  const likeInsight = (id: string) => {
    setInsights((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, likes: ins.likes + 1 } : ins))
    );
  };

  return (
    <BarrierContext.Provider
      value={{
        barriers,
        routes,
        insights,
        myReports,
        selectedRoute,
        setSelectedRoute,
        selectedCategory,
        setSelectedCategory,
        selectedSeverity,
        setSelectedSeverity,
        isLoading,
        serverError,
        activityTimeline,
        metrics,
        addBarrier,
        updateBarrierStatus,
        assignBarrierTeam,
        linkDuplicateBarrier,
        upvoteBarrier,
        resetToSeedData,
        checkDuplicates,
        addInsight,
        likeInsight,
      }}
    >
      {children}
    </BarrierContext.Provider>
  );
};

export { useBarriers } from './useBarriers';
