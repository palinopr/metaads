/**
 * Navigation Manager
 * Manages cohesive navigation and routing across all features
 */

import { featureManager } from './feature-manager';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  description?: string;
  requiredFeature?: string;
  requiredRole?: string[];
  badge?: string;
  children?: NavigationItem[];
  external?: boolean;
  hidden?: boolean;
  order: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export class NavigationManager {
  private navigationItems: NavigationItem[] = [];
  private currentPath: string = '';
  private currentUser: { roles: string[] } | null = null;

  constructor() {
    this.initializeNavigation();
  }

  private initializeNavigation() {
    this.navigationItems = [
      // Dashboard Section
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'BarChart3',
        description: 'Main dashboard with campaign overview',
        order: 10
      },
      {
        id: 'overview',
        label: 'Overview',
        href: '/',
        icon: 'Home',
        description: 'Quick overview and getting started',
        order: 5
      },

      // Data & Analytics Section
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: 'TrendingUp',
        description: 'Advanced analytics and insights',
        requiredFeature: 'ai_insights_basic',
        order: 20,
        children: [
          {
            id: 'pattern-analysis',
            label: 'Pattern Analysis',
            href: '/pattern-analysis',
            icon: 'Activity',
            description: 'Analyze campaign patterns and trends',
            requiredFeature: 'ai_insights_advanced',
            order: 21
          },
          {
            id: 'realtime',
            label: 'Real-time Data',
            href: '/realtime',
            icon: 'Zap',
            description: 'Live campaign performance monitoring',
            requiredFeature: 'pipeline_real_time',
            order: 22
          }
        ]
      },

      // Campaign Management Section
      {
        id: 'campaigns',
        label: 'Campaigns',
        href: '/campaigns',
        icon: 'Target',
        description: 'Manage your Meta ad campaigns',
        requiredFeature: 'auth_oauth_flow',
        order: 30,
        children: [
          {
            id: 'campaign-comparison',
            label: 'Campaign Comparison',
            href: '/campaigns/comparison',
            icon: 'GitCompare',
            description: 'Compare campaign performance',
            order: 31
          },
          {
            id: 'budget-optimization',
            label: 'Budget Optimization',
            href: '/campaigns/budget',
            icon: 'DollarSign',
            description: 'Optimize campaign budgets',
            requiredFeature: 'ai_insights_basic',
            order: 32
          }
        ]
      },

      // Multi-Account Management
      {
        id: 'portfolio',
        label: 'Portfolio',
        href: '/portfolio',
        icon: 'Briefcase',
        description: 'Manage multiple ad accounts',
        requiredFeature: 'auth_multi_account',
        order: 40
      },

      // Automation Section
      {
        id: 'automation',
        label: 'Automation',
        href: '/automation',
        icon: 'Bot',
        description: 'Automated rules and reporting',
        requiredFeature: 'automation_reporting',
        order: 50,
        children: [
          {
            id: 'reports',
            label: 'Reports',
            href: '/reports',
            icon: 'FileText',
            description: 'Automated report generation',
            order: 51
          },
          {
            id: 'alerts',
            label: 'Alerts',
            href: '/alerts',
            icon: 'Bell',
            description: 'Performance alerts and notifications',
            requiredFeature: 'automation_alerts',
            order: 52
          }
        ]
      },

      // Creative Intelligence Section
      {
        id: 'creative',
        label: 'Creative Intelligence',
        href: '/creative',
        icon: 'Palette',
        description: 'AI-powered creative analysis',
        requiredFeature: 'ai_creative_analysis',
        order: 60,
        children: [
          {
            id: 'creative-library',
            label: 'Creative Library',
            href: '/creative/library',
            icon: 'Images',
            description: 'Manage and analyze creatives',
            order: 61
          },
          {
            id: 'ab-testing',
            label: 'A/B Testing',
            href: '/creative/ab-testing',
            icon: 'Split',
            description: 'Creative A/B test management',
            requiredFeature: 'testing_ab_framework',
            order: 62
          }
        ]
      },

      // Competitive Intelligence Section
      {
        id: 'competitive',
        label: 'Competitive Intelligence',
        href: '/competitive',
        icon: 'Eye',
        description: 'Market and competitor analysis',
        requiredFeature: 'ai_insights_advanced',
        order: 70,
        children: [
          {
            id: 'market-analysis',
            label: 'Market Analysis',
            href: '/competitive/market',
            icon: 'TrendingUp',
            description: 'Market trends and opportunities',
            order: 71
          },
          {
            id: 'competitor-tracking',
            label: 'Competitor Tracking',
            href: '/competitive/tracking',
            icon: 'Search',
            description: 'Track competitor performance',
            order: 72
          }
        ]
      },

      // Tools Section
      {
        id: 'tools',
        label: 'Tools',
        href: '/tools',
        icon: 'Wrench',
        description: 'Utility tools and calculators',
        order: 80,
        children: [
          {
            id: 'roi-calculator',
            label: 'ROI Calculator',
            href: '/tools/roi',
            icon: 'Calculator',
            description: 'Calculate return on investment',
            order: 81
          },
          {
            id: 'debug',
            label: 'Debug Panel',
            href: '/debug',
            icon: 'Bug',
            description: 'Debug tools and system status',
            requiredRole: ['admin', 'developer'],
            order: 82
          }
        ]
      },

      // Testing Section (Development/Staging only)
      {
        id: 'testing',
        label: 'Testing',
        href: '/testing',
        icon: 'TestTube',
        description: 'Testing tools and demos',
        requiredRole: ['admin', 'developer'],
        hidden: process.env.NODE_ENV === 'production',
        order: 90,
        children: [
          {
            id: 'test-meta-api',
            label: 'Meta API Test',
            href: '/test-meta-api',
            icon: 'Plug',
            description: 'Test Meta API integration',
            order: 91
          },
          {
            id: 'ui-showcase',
            label: 'UI Showcase',
            href: '/ui-showcase',
            icon: 'Palette',
            description: 'UI component showcase',
            order: 92
          },
          {
            id: 'showcase',
            label: 'Feature Showcase',
            href: '/showcase',
            icon: 'Star',
            description: 'Feature demonstrations',
            order: 93
          }
        ]
      },

      // System Section
      {
        id: 'system',
        label: 'System',
        href: '/system',
        icon: 'Settings',
        description: 'System configuration and monitoring',
        requiredRole: ['admin'],
        order: 100,
        children: [
          {
            id: 'settings',
            label: 'Settings',
            href: '/settings',
            icon: 'Settings',
            description: 'Application settings',
            order: 101
          },
          {
            id: 'logs',
            label: 'System Logs',
            href: '/logs',
            icon: 'FileText',
            description: 'System logs and monitoring',
            order: 102
          },
          {
            id: 'api-debug',
            label: 'API Debug',
            href: '/api-debug',
            icon: 'Code',
            description: 'API debugging interface',
            order: 103
          }
        ]
      },

      // Legacy/Lite Versions
      {
        id: 'lite',
        label: 'Dashboard Lite',
        href: '/dashboard-lite',
        icon: 'Minimize',
        description: 'Lightweight dashboard version',
        order: 200,
        badge: 'Lite'
      },
      {
        id: 'simple',
        label: 'Simple Dashboard',
        href: '/simple-dashboard',
        icon: 'Square',
        description: 'Simple dashboard interface',
        order: 201,
        badge: 'Basic'
      },

      // Offline Support
      {
        id: 'offline',
        label: 'Offline Mode',
        href: '/offline',
        icon: 'WifiOff',
        description: 'Offline functionality',
        requiredFeature: 'offline_support',
        order: 210
      },

      // Help & Documentation
      {
        id: 'help',
        label: 'Help',
        href: '/help',
        icon: 'HelpCircle',
        description: 'Help and documentation',
        order: 300,
        children: [
          {
            id: 'about',
            label: 'About',
            href: '/about',
            icon: 'Info',
            description: 'About this application',
            order: 301
          },
          {
            id: 'docs',
            label: 'Documentation',
            href: '/docs',
            icon: 'Book',
            description: 'User documentation',
            external: true,
            order: 302
          }
        ]
      }
    ];
  }

  public setCurrentUser(user: { roles: string[] } | null) {
    this.currentUser = user;
  }

  public setCurrentPath(path: string) {
    this.currentPath = path;
  }

  public getNavigationItems(includeHidden: boolean = false): NavigationItem[] {
    return this.navigationItems
      .filter(item => this.isItemVisible(item, includeHidden))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => this.isItemVisible(child, includeHidden))
      }))
      .sort((a, b) => a.order - b.order);
  }

  public getTopLevelItems(): NavigationItem[] {
    return this.getNavigationItems().filter(item => !item.children || item.children.length === 0);
  }

  public getItemsBySection(section: string): NavigationItem[] {
    return this.getNavigationItems().filter(item => 
      item.id.startsWith(section) || 
      item.children?.some(child => child.id.startsWith(section))
    );
  }

  private isItemVisible(item: NavigationItem, includeHidden: boolean): boolean {
    // Check if hidden and we're not including hidden items
    if (item.hidden && !includeHidden) {
      return false;
    }

    // Check feature requirements
    if (item.requiredFeature && !featureManager.isFeatureEnabled(item.requiredFeature)) {
      return false;
    }

    // Check role requirements
    if (item.requiredRole && this.currentUser) {
      const hasRequiredRole = item.requiredRole.some(role => 
        this.currentUser!.roles.includes(role)
      );
      if (!hasRequiredRole) {
        return false;
      }
    } else if (item.requiredRole && !this.currentUser) {
      // User not logged in but role required
      return false;
    }

    return true;
  }

  public getBreadcrumbs(): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    const pathParts = this.currentPath.split('/').filter(Boolean);

    if (pathParts.length === 0) {
      return [{ label: 'Home', current: true }];
    }

    // Add Home
    breadcrumbs.push({ label: 'Home', href: '/' });

    // Find navigation item for current path
    const currentItem = this.findItemByPath(this.currentPath);
    if (currentItem) {
      // Find parent items
      const parentItems = this.findParentItems(currentItem);
      
      // Add parent breadcrumbs
      parentItems.forEach(parent => {
        breadcrumbs.push({ label: parent.label, href: parent.href });
      });

      // Add current item
      breadcrumbs.push({ label: currentItem.label, current: true });
    } else {
      // Fallback: create breadcrumbs from path
      let currentPath = '';
      pathParts.forEach((part, index) => {
        currentPath += `/${part}`;
        const isLast = index === pathParts.length - 1;
        breadcrumbs.push({
          label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
          href: isLast ? undefined : currentPath,
          current: isLast
        });
      });
    }

    return breadcrumbs;
  }

  private findItemByPath(path: string): NavigationItem | null {
    for (const item of this.navigationItems) {
      if (item.href === path) {
        return item;
      }
      if (item.children) {
        const childItem = item.children.find(child => child.href === path);
        if (childItem) {
          return childItem;
        }
      }
    }
    return null;
  }

  private findParentItems(targetItem: NavigationItem): NavigationItem[] {
    for (const item of this.navigationItems) {
      if (item.children?.includes(targetItem)) {
        return [item];
      }
    }
    return [];
  }

  public getQuickActions(): NavigationItem[] {
    return this.getNavigationItems()
      .filter(item => ['dashboard', 'campaigns', 'reports', 'settings'].includes(item.id))
      .slice(0, 4);
  }

  public getRecentlyViewed(): NavigationItem[] {
    // In a real implementation, this would come from user history
    try {
      const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      return recent
        .map((path: string) => this.findItemByPath(path))
        .filter(Boolean)
        .slice(0, 5);
    } catch {
      return [];
    }
  }

  public addToRecentlyViewed(path: string) {
    try {
      const recent = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const filtered = recent.filter((p: string) => p !== path);
      filtered.unshift(path);
      localStorage.setItem('recentlyViewed', JSON.stringify(filtered.slice(0, 10)));
    } catch {
      // Ignore storage errors
    }
  }

  public searchItems(query: string): NavigationItem[] {
    const lowercaseQuery = query.toLowerCase();
    const results: NavigationItem[] = [];

    const searchInItem = (item: NavigationItem) => {
      const matches = 
        item.label.toLowerCase().includes(lowercaseQuery) ||
        item.description?.toLowerCase().includes(lowercaseQuery) ||
        item.href.toLowerCase().includes(lowercaseQuery);

      if (matches && this.isItemVisible(item, false)) {
        results.push(item);
      }

      item.children?.forEach(child => searchInItem(child));
    };

    this.navigationItems.forEach(item => searchInItem(item));
    
    return results.slice(0, 10); // Limit results
  }

  public getActiveItem(): NavigationItem | null {
    return this.findItemByPath(this.currentPath);
  }

  public isActiveItem(item: NavigationItem): boolean {
    return item.href === this.currentPath || 
           (item.children?.some(child => child.href === this.currentPath) ?? false);
  }

  public getNavigationStats() {
    const allItems = this.getAllItems();
    const visibleItems = this.getNavigationItems();
    
    return {
      total: allItems.length,
      visible: visibleItems.length,
      hidden: allItems.length - visibleItems.length,
      featureGated: allItems.filter(item => item.requiredFeature).length,
      roleRestricted: allItems.filter(item => item.requiredRole).length,
      sections: this.getTopLevelItems().length
    };
  }

  private getAllItems(): NavigationItem[] {
    const items: NavigationItem[] = [];
    const addItems = (itemList: NavigationItem[]) => {
      itemList.forEach(item => {
        items.push(item);
        if (item.children) {
          addItems(item.children);
        }
      });
    };
    addItems(this.navigationItems);
    return items;
  }
}

// Singleton instance
export const navigationManager = new NavigationManager();