/**
 * Integration Provider
 * React context provider for integration system
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { featureManager, FeatureManager } from '@/lib/integration/feature-manager';
import { integrationManager, IntegrationManager, IntegrationStatus } from '@/lib/integration/integration-manager';
import { navigationManager, NavigationManager, NavigationItem } from '@/lib/integration/navigation-manager';
import { conflictResolver, ConflictResolver } from '@/lib/integration/conflict-resolver';

interface IntegrationContextType {
  // Feature Management
  isFeatureEnabled: (featureId: string) => boolean;
  enableFeature: (featureId: string, rolloutPercentage?: number) => boolean;
  disableFeature: (featureId: string) => boolean;
  getFeatureStats: () => any;

  // Integration Status
  integrationStatus: IntegrationStatus | null;
  refreshStatus: () => Promise<void>;

  // Navigation
  navigationItems: NavigationItem[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
  breadcrumbs: Array<{ label: string; href?: string; current?: boolean }>;
  searchNavigation: (query: string) => NavigationItem[];

  // Conflict Resolution
  resolveConflicts: () => Promise<void>;
  getConflictStats: () => any;

  // System Health
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: string | null;
}

const IntegrationContext = createContext<IntegrationContextType | null>(null);

interface IntegrationProviderProps {
  children: ReactNode;
  initialPath?: string;
  userProfile?: {
    id: string;
    roles: string[];
    segment: string;
    enrolledFeatures: string[];
  };
}

export function IntegrationProvider({ 
  children, 
  initialPath = '/',
  userProfile 
}: IntegrationProviderProps) {
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; href?: string; current?: boolean }>>([]);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'unhealthy'>('healthy');
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);

  // Initialize system
  useEffect(() => {
    initializeIntegration();
  }, []);

  // Update user profile
  useEffect(() => {
    if (userProfile) {
      featureManager.setUserProfile(userProfile);
      navigationManager.setCurrentUser(userProfile);
      updateNavigation();
    }
  }, [userProfile]);

  // Update current path
  useEffect(() => {
    navigationManager.setCurrentPath(currentPath);
    navigationManager.addToRecentlyViewed(currentPath);
    setBreadcrumbs(navigationManager.getBreadcrumbs());
  }, [currentPath]);

  const initializeIntegration = async () => {
    try {
      // Start automatic conflict resolution
      conflictResolver.startAutoResolution(30000); // Every 30 seconds

      // Initial status check
      await refreshStatus();

      // Update navigation
      updateNavigation();

      // Start periodic health checks
      const healthInterval = setInterval(async () => {
        await refreshStatus();
      }, 60000); // Every minute

      // Cleanup on unmount
      return () => {
        clearInterval(healthInterval);
      };
    } catch (error) {
      console.error('Failed to initialize integration system:', error);
    }
  };

  const refreshStatus = async () => {
    try {
      const status = integrationManager.getStatus();
      setIntegrationStatus(status);
      setSystemHealth(status.overall);
      setLastHealthCheck(new Date().toISOString());

      // Resolve conflicts if system is degraded
      if (status.overall !== 'healthy') {
        await conflictResolver.resolveConflicts();
      }
    } catch (error) {
      console.error('Failed to refresh integration status:', error);
      setSystemHealth('unhealthy');
    }
  };

  const updateNavigation = () => {
    const items = navigationManager.getNavigationItems();
    setNavigationItems(items);
    setBreadcrumbs(navigationManager.getBreadcrumbs());
  };

  const isFeatureEnabled = (featureId: string): boolean => {
    return featureManager.isFeatureEnabled(featureId);
  };

  const enableFeature = (featureId: string, rolloutPercentage?: number): boolean => {
    const result = featureManager.enableFeature(featureId, rolloutPercentage);
    if (result) {
      updateNavigation();
    }
    return result;
  };

  const disableFeature = (featureId: string): boolean => {
    const result = featureManager.disableFeature(featureId);
    if (result) {
      updateNavigation();
    }
    return result;
  };

  const getFeatureStats = () => {
    return featureManager.getStats();
  };

  const searchNavigation = (query: string): NavigationItem[] => {
    return navigationManager.searchItems(query);
  };

  const resolveConflicts = async () => {
    await conflictResolver.resolveConflicts();
    await refreshStatus();
    updateNavigation();
  };

  const getConflictStats = () => {
    return conflictResolver.getStats();
  };

  const contextValue: IntegrationContextType = {
    // Feature Management
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    getFeatureStats,

    // Integration Status
    integrationStatus,
    refreshStatus,

    // Navigation
    navigationItems,
    currentPath,
    setCurrentPath,
    breadcrumbs,
    searchNavigation,

    // Conflict Resolution
    resolveConflicts,
    getConflictStats,

    // System Health
    systemHealth,
    lastHealthCheck
  };

  return (
    <IntegrationContext.Provider value={contextValue}>
      {children}
    </IntegrationContext.Provider>
  );
}

export function useIntegration(): IntegrationContextType {
  const context = useContext(IntegrationContext);
  if (!context) {
    throw new Error('useIntegration must be used within an IntegrationProvider');
  }
  return context;
}

// Convenience hooks
export function useFeature(featureId: string): boolean {
  const { isFeatureEnabled } = useIntegration();
  return isFeatureEnabled(featureId);
}

export function useNavigation() {
  const { navigationItems, currentPath, setCurrentPath, breadcrumbs, searchNavigation } = useIntegration();
  return { navigationItems, currentPath, setCurrentPath, breadcrumbs, searchNavigation };
}

export function useSystemHealth() {
  const { systemHealth, lastHealthCheck, integrationStatus, refreshStatus } = useIntegration();
  return { systemHealth, lastHealthCheck, integrationStatus, refreshStatus };
}

// Higher-order component for feature gating
export function withFeatureGate<P extends object>(
  featureId: string,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureGatedComponent(props: P) {
    const isEnabled = useFeature(featureId);
    
    if (!isEnabled) {
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }
    
    return <Component {...props} />;
  };
}

// Component for conditional rendering based on features
export function FeatureGate({ 
  feature, 
  children, 
  fallback = null 
}: { 
  feature: string; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const isEnabled = useFeature(feature);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

// Component for rendering multiple features with priority
export function FeaturePriority({ 
  features, 
  children 
}: { 
  features: Array<{ id: string; component: ReactNode; priority?: number }>; 
  children?: ReactNode;
}) {
  const { isFeatureEnabled } = useIntegration();
  
  // Sort by priority (higher first) and find first enabled feature
  const sortedFeatures = features.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const enabledFeature = sortedFeatures.find(feature => isFeatureEnabled(feature.id));
  
  if (enabledFeature) {
    return <>{enabledFeature.component}</>;
  }
  
  return <>{children}</>;
}