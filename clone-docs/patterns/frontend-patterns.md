# Frontend Architecture Patterns

## Overview
Complete analysis of React 19.1 frontend architecture with TypeScript, Tailwind CSS, and modern UI patterns for building scalable, responsive web applications.

## Table of Contents
1. [Component Architecture](#component-architecture)
2. [State Management](#state-management)
3. [UI Design System](#ui-design-system)
4. [Responsive Design](#responsive-design)
5. [Hook Patterns](#hook-patterns)
6. [Context Management](#context-management)
7. [Component Composition](#component-composition)

---

## Component Architecture

### 1. Component File Structure
```
src/
├── components/
│   ├── ui/                      # Base UI components (reusable)
│   ├── layout/                  # Layout-specific components
│   ├── shared/                  # Business logic components
│   └── icons/                   # Icon components
├── routes/                      # Page-level components
├── contexts/                    # React contexts
└── hooks/                       # Custom hooks
```

### 2. Component Naming Conventions
- **PascalCase**: All components (`Button`, `UserProfile`)
- **File names**: Match component name (`button.tsx`, `user-profile.tsx`)
- **Props interfaces**: ComponentName + Props (`ButtonProps`)

### 3. Component Patterns

#### Base UI Component Pattern
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Variant configuration with class-variance-authority
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-text-secondary text-bg-3 shadow-xs hover:bg-text-secondary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-bg-3 dark:bg-bg-2 shadow-xs hover:bg-bg-4 hover:text-text-secondary",
        secondary: "bg-bg-2 text-text-secondary shadow-xs hover:bg-bg-2/80",
        ghost: "hover:bg-accent hover:text-text-secondary dark:hover:bg-accent/50 text-text-primary",
        link: "text-text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Component with proper TypeScript typing
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

#### Compound Component Pattern
```tsx
// Sidebar with compound components
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { state, openMobile, setOpenMobile, isMobile } = useSidebar()

  return (
    <div
      data-sidebar="sidebar"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      className={cn("group peer", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Sub-components
Sidebar.Header = SidebarHeader
Sidebar.Content = SidebarContent
Sidebar.Footer = SidebarFooter
```

#### Layout Component Pattern
```tsx
// App layout with provider composition
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppsDataProvider>
      <SidebarProvider 
        defaultOpen={false}
        style={{
          "--sidebar-width": "320px",
          "--sidebar-width-mobile": "280px",
          "--sidebar-width-icon": "52px"
        } as React.CSSProperties}
      >
        <AppSidebar />
        <SidebarInset className="bg-bg-3 flex flex-col h-screen relative">
          <GlobalHeader />
          <div className="flex-1 bg-bg-3">
            {children || <Outlet />}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AppsDataProvider>
  );
}
```

---

## State Management

### 1. Context-Based State Management

#### Authentication Context Pattern
```tsx
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth provider configuration
  authProviders: {
    google: boolean;
    github: boolean;
    email: boolean;
  } | null;
  
  // Methods
  login: (provider: 'google' | 'github', redirectUrl?: string) => void;
  loginWithEmail: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider with complex state management
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Token refresh management
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Redirect URL management
  const setIntendedUrl = useCallback((url: string) => {
    try {
      sessionStorage.setItem('auth_intended_url', url);
    } catch (error) {
      console.warn('Failed to store intended URL:', error);
    }
  }, []);

  // Auto-refresh implementation
  useEffect(() => {
    if (user && token) {
      refreshTimerRef.current = setTimeout(refreshUser, TOKEN_REFRESH_INTERVAL);
    }
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [user, token, refreshUser]);

  return (
    <AuthContext.Provider value={{
      user, token, session, isAuthenticated, isLoading, error,
      authProviders, hasOAuth, requiresEmailAuth,
      login, loginWithEmail, logout, refreshUser, clearError,
      setIntendedUrl, getIntendedUrl, clearIntendedUrl
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### Theme Context Pattern
```tsx
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'system';
  });

  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(newTheme);
    }
  };

  // System theme change listener
  useEffect(() => {
    applyTheme(theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme); // Immediate application
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### 2. Data Fetching Patterns

#### Custom Hook for API Data
```tsx
export function useUserStats() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/api/v1/users/stats');
      if (response.ok && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}
```

---

## UI Design System

### 1. Design Token Architecture

#### CSS Custom Properties System
```css
:root {
  /* Base design tokens */
  --radius: 0.625rem;
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  
  /* Brand colors */
  --build-accent-color: #ff3d00;
  
  /* Background hierarchy */
  --build-chat-colors-bg-1: #e7e7e7;    /* Deepest background */
  --build-chat-colors-bg-2: #f6f6f6;    /* Container background */
  --build-chat-colors-bg-3: #fbfbfc;    /* Surface background */
  --build-chat-colors-bg-4: #ffffff;    /* Elevated surface */
  
  /* Border hierarchy */
  --build-chat-colors-border-primary: #e5e5e5;
  --build-chat-colors-border-secondary: #eeeeee;
  --build-chat-colors-border-tertiary: #eeeeee;
  
  /* Text hierarchy */
  --build-chat-colors-text-primary: #0a0a0a;      /* Primary text */
  --build-chat-colors-text-secondary: #171717;    /* Secondary text */
  --build-chat-colors-text-tertiary: #21212199;   /* Muted text */
  --build-chat-colors-text-inverted: #ffffff;     /* Inverted text */
}

.dark {
  /* Dark mode overrides */
  --build-chat-colors-bg-1: #151515;
  --build-chat-colors-bg-2: #1f2020;
  --build-chat-colors-bg-3: #292929;
  --build-chat-colors-bg-4: #3c3c3c;
  
  --build-chat-colors-text-primary: #ffffff;
  --build-chat-colors-text-secondary: #cdcaca;
  --build-chat-colors-text-tertiary: #bcb9b9;
  --build-chat-colors-text-inverted: #000000;
}
```

#### Tailwind Theme Integration
```js
// tailwind.config.js theme extension
module.exports = {
  theme: {
    extend: {
      colors: {
        // Semantic color mapping
        'bg-1': 'var(--color-bg-1)',
        'bg-2': 'var(--color-bg-2)',
        'bg-3': 'var(--color-bg-3)',
        'bg-4': 'var(--color-bg-4)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'border-tertiary': 'var(--color-border-tertiary)',
      },
      borderRadius: {
        'sm': 'calc(var(--radius) - 4px)',
        'md': 'calc(var(--radius) - 2px)',
        'lg': 'var(--radius)',
        'xl': 'calc(var(--radius) + 4px)',
      },
      boxShadow: {
        'dialog': 'var(--shadow-dialog)',
        'elevation': 'var(--shadow-elevation)',
        'textarea': 'var(--shadow-textarea)',
      },
    },
  },
}
```

### 2. Component Variant System

#### Class Variance Authority Pattern
```tsx
import { cva, type VariantProps } from "class-variance-authority"

// Alert component variants
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-text-primary [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-bg-4 text-text-primary border-border-primary [&>svg]:text-text-primary",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/5",
        warning: "border-yellow-500/50 text-yellow-700 dark:border-yellow-500 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
        success: "border-green-500/50 text-green-700 dark:border-green-500 [&>svg]:text-green-600 bg-green-50 dark:bg-green-900/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Usage with TypeScript
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}
```

### 3. Animation and Interaction Patterns

#### Custom Animation Classes
```css
/* Chat edge throb effect */
@keyframes chat-edge-throb {
  0%, 100% {
    box-shadow:
      0 0 0 0 rgba(246, 130, 31, 0.10),
      inset 0 0 0 1px rgba(246, 130, 31, 0.16);
  }
  50% {
    box-shadow:
      0 0 0 6px rgba(255, 61, 0, 0.08),
      inset 0 0 0 2px rgba(255, 61, 0, 0.22);
  }
}

.chat-edge-throb {
  animation: chat-edge-throb 1.6s ease-in-out infinite;
  border-radius: 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .chat-edge-throb { 
    animation: none; 
  }
}
```

#### Focus and Interaction States
```css
/* Global focus styles */
* {
  @apply outline-ring/50;
}

/* Button focus styles */
.button-base {
  @apply outline-none 
         focus-visible:border-ring 
         focus-visible:ring-ring/50 
         focus-visible:ring-[3px] 
         aria-invalid:ring-destructive/20 
         dark:aria-invalid:ring-destructive/40 
         aria-invalid:border-destructive 
         cursor-pointer;
}
```

---

## Responsive Design

### 1. Mobile-First Approach

#### Breakpoint Strategy
```tsx
// Mobile breakpoint detection hook
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```

#### Responsive Component Pattern
```tsx
// Responsive sidebar with mobile detection
function Sidebar({ children, ...props }) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className="w-[var(--sidebar-width)] bg-bg-2 border-r-[0.5px] border-border-primary p-0 [&>button]:hidden"
          style={{ "--sidebar-width": "320px" } as React.CSSProperties}
        >
          <div className="flex h-full w-full flex-col">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer hidden md:block bg-bg-2"
      data-state={state}
      data-collapsible={state === "collapsed" ? "offcanvas" : ""}
    >
      {children}
    </div>
  )
}
```

### 2. Responsive Typography and Spacing

#### Tailwind Responsive Classes
```tsx
// Responsive typography scaling
<h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">
  Responsive Heading
</h1>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {/* Responsive grid */}
  </div>
</div>

// Responsive sidebar widths
<SidebarProvider 
  style={{
    "--sidebar-width": "320px",
    "--sidebar-width-mobile": "280px",
    "--sidebar-width-icon": "52px"
  } as React.CSSProperties}
>
```

---

## Hook Patterns

### 1. Custom Hook Architecture

#### Data Fetching Hook Pattern
```tsx
export function useInfiniteScroll<T>(
  fetchFunction: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchFunction(page);
      
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, page, isLoading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset
  };
}
```

#### Media Query Hook Pattern
```tsx
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Usage
const isMobile = useMediaQuery('(max-width: 768px)');
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
```

### 2. State Management Hooks

#### Complex State Hook Pattern
```tsx
export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store intended URL for post-login redirect
      const intendedUrl = location.pathname + location.search;
      sessionStorage.setItem('auth_intended_url', intendedUrl);
      navigate('/auth/login');
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  return {
    isAuthenticated,
    isLoading,
    shouldRender: !isLoading && isAuthenticated
  };
}
```

---

## Context Management

### 1. Context Composition Pattern

#### Provider Composition
```tsx
// Multiple context providers composition
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AppsDataProvider>
              {children}
            </AppsDataProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
```

#### Context with Reducer Pattern
```tsx
interface SidebarState {
  isOpen: boolean;
  isMobile: boolean;
  isCollapsed: boolean;
}

type SidebarAction = 
  | { type: 'TOGGLE' }
  | { type: 'SET_MOBILE'; payload: boolean }
  | { type: 'SET_COLLAPSED'; payload: boolean };

function sidebarReducer(state: SidebarState, action: SidebarAction): SidebarState {
  switch (action.type) {
    case 'TOGGLE':
      return { ...state, isOpen: !state.isOpen };
    case 'SET_MOBILE':
      return { ...state, isMobile: action.payload };
    case 'SET_COLLAPSED':
      return { ...state, isCollapsed: action.payload };
    default:
      return state;
  }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sidebarReducer, {
    isOpen: false,
    isMobile: false,
    isCollapsed: false
  });

  const value = useMemo(() => ({
    ...state,
    toggle: () => dispatch({ type: 'TOGGLE' }),
    setMobile: (isMobile: boolean) => dispatch({ type: 'SET_MOBILE', payload: isMobile }),
    setCollapsed: (isCollapsed: boolean) => dispatch({ type: 'SET_COLLAPSED', payload: isCollapsed })
  }), [state]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}
```

---

## Component Composition

### 1. Radix UI Integration Pattern

#### Primitive Component Wrapping
```tsx
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root {...props} />
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-bg-4 p-1 text-text-primary shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}
```

### 2. Render Props Pattern

#### Flexible Component API
```tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderError?: (error: string) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  renderEmpty,
  renderLoading,
  renderError
}: DataTableProps<T>) {
  if (isLoading) {
    return renderLoading ? renderLoading() : <div>Loading...</div>;
  }

  if (data.length === 0) {
    return renderEmpty ? renderEmpty() : <div>No data</div>;
  }

  return (
    <Table>
      <TableHeader>
        {/* Column headers */}
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index}>
            {/* Row cells */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Development Rules

### 1. Component Development Guidelines

#### TypeScript Best Practices
- **Always export component interfaces**: Make props interfaces available for extension
- **Use proper component typing**: `React.ComponentProps<"element">` for native elements
- **Extend HTML attributes**: Spread native props for accessibility and flexibility
- **Use generic components**: For reusable data components like tables and lists

#### Accessibility Standards
- **Semantic HTML**: Use proper HTML elements and ARIA attributes
- **Focus management**: Implement proper focus states and keyboard navigation
- **Screen reader support**: Include proper labels and descriptions
- **Color contrast**: Ensure sufficient contrast ratios for text and backgrounds

#### Performance Optimization
- **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` appropriately
- **Code splitting**: Implement lazy loading for route components
- **Bundle optimization**: Use dynamic imports for large dependencies
- **Image optimization**: Implement responsive images with proper formats

### 2. Styling Guidelines

#### CSS-in-JS with Tailwind
- **Utility-first approach**: Prefer Tailwind utilities over custom CSS
- **Consistent spacing**: Use design system spacing tokens
- **Responsive design**: Mobile-first responsive classes
- **Dark mode support**: Implement proper dark mode variants

#### Component Styling Rules
- **Composition over inheritance**: Use component composition for styling variants
- **Design tokens**: Use CSS custom properties for consistent theming
- **State-based styling**: Use data attributes for component state styling
- **Animation guidelines**: Respect `prefers-reduced-motion` for accessibility

This frontend architecture provides a solid foundation for building scalable, maintainable React applications with modern UI patterns, proper TypeScript integration, and comprehensive accessibility support.