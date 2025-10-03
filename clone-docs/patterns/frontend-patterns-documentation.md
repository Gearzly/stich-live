# Frontend Architecture Patterns & Component Documentation

**Framework:** React 19.1.1 + TypeScript + Tailwind CSS  
**Build Tool:** Vite with Rolldown  
**Component Library:** Radix UI + Custom Components

---

## 🏗️ Component Architecture Overview

### Atomic Design Structure
```
src/components/
├── ui/                    # Atomic components (Level 1)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── primitives/            # Base UI building blocks (Level 2)
│   ├── accordion.tsx
│   ├── alert-dialog.tsx
│   ├── avatar.tsx
│   └── ...
├── shared/               # Reusable business components (Level 3)
│   ├── code-editor.tsx
│   ├── file-tree.tsx
│   ├── progress-bar.tsx
│   └── ...
├── layout/               # Layout components (Level 4)
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── main-content.tsx
│   └── ...
├── auth/                 # Authentication components (Level 5)
│   ├── login-modal.tsx
│   ├── user-menu.tsx
│   └── ...
├── analytics/            # Analytics dashboard components
│   ├── usage-chart.tsx
│   ├── stats-card.tsx
│   └── ...
└── monaco-editor/        # Code editor integration
    ├── monaco-editor.tsx
    └── monaco-editor.module.css
```

---

## 🎨 Design System Patterns

### 1. **Theme System Pattern**
```typescript
// src/contexts/theme-context.tsx
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  resolvedTheme: 'light' | 'dark'
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }
    }

    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <div className={resolvedTheme} data-theme={resolvedTheme}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
```

### 2. **Component Composition Pattern**
```typescript
// src/components/ui/card.tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow",
        className
      )}
      {...props}
    />
  )
)

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
)

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  )
)

// Usage Example
<Card>
  <CardHeader>
    <h3>Project Title</h3>
    <p>Project description</p>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### 3. **Responsive Layout Pattern**
```typescript
// src/components/layout/responsive-layout.tsx
interface ResponsiveLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
}

export const ResponsiveLayout = ({ children, sidebar, header }: ResponsiveLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0",
        isMobile && !sidebarOpen && "-translate-x-full"
      )}>
        {sidebar}
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {header && (
          <header className="border-b bg-background/95 backdrop-blur">
            {header}
          </header>
        )}
        
        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## 🔧 Custom Hook Patterns

### 1. **API Integration Hook**
```typescript
// src/hooks/use-api.ts
interface UseApiOptions<T> {
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  refetchInterval?: number
}

export function useApi<T>(
  endpoint: string,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { enabled = true, onSuccess, onError, refetchInterval } = options

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get(endpoint)
      setData(response.data)
      onSuccess?.(response.data)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [endpoint, enabled, onSuccess, onError])

  useEffect(() => {
    fetchData()

    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refetchInterval])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  const mutate = useCallback((newData: T) => {
    setData(newData)
  }, [])

  return { data, loading, error, refetch, mutate }
}
```

### 2. **WebSocket Hook**
```typescript
// src/hooks/use-websocket.ts
interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  const { onMessage, onConnect, onDisconnect, onError } = options

  useEffect(() => {
    const newSocket = io(url, {
      transports: ['websocket']
    })

    newSocket.on('connect', () => {
      setConnected(true)
      onConnect?.()
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
      onDisconnect?.()
    })

    newSocket.on('message', (data) => {
      setLastMessage(data)
      onMessage?.(data)
    })

    newSocket.on('error', (error) => {
      onError?.(error)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [url, onMessage, onConnect, onDisconnect, onError])

  const sendMessage = useCallback((message: any) => {
    if (socket && connected) {
      socket.emit('message', message)
    }
  }, [socket, connected])

  const joinRoom = useCallback((room: string) => {
    if (socket && connected) {
      socket.emit('join_session', room)
    }
  }, [socket, connected])

  return {
    socket,
    connected,
    lastMessage,
    sendMessage,
    joinRoom
  }
}
```

### 3. **Form Management Hook**
```typescript
// src/hooks/use-form.ts
interface UseFormOptions<T> {
  initialValues: T
  validationSchema?: any
  onSubmit: (values: T) => Promise<void> | void
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  const setFieldTouched = useCallback((name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const validate = useCallback(async () => {
    if (!validationSchema) return true

    try {
      await validationSchema.validate(values, { abortEarly: false })
      setErrors({})
      return true
    } catch (error: any) {
      const newErrors: Partial<Record<keyof T, string>> = {}
      
      error.inner?.forEach((err: any) => {
        if (err.path) {
          newErrors[err.path as keyof T] = err.message
        }
      })
      
      setErrors(newErrors)
      return false
    }
  }, [values, validationSchema])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    setSubmitting(true)
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true
      return acc
    }, {} as Partial<Record<keyof T, boolean>>)
    setTouched(allTouched)

    const isValid = await validate()
    
    if (isValid) {
      try {
        await onSubmit(values)
      } catch (error) {
        console.error('Form submission error:', error)
      }
    }
    
    setSubmitting(false)
  }, [values, validate, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setSubmitting(false)
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    submitting,
    setValue,
    setFieldTouched,
    handleSubmit,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}
```

---

## 🎯 State Management Patterns

### 1. **Context + Reducer Pattern**
```typescript
// src/contexts/apps-context.tsx
interface App {
  id: string
  name: string
  description: string
  status: 'draft' | 'generating' | 'completed' | 'deployed'
  createdAt: string
  updatedAt: string
}

interface AppsState {
  apps: App[]
  loading: boolean
  error: string | null
  currentApp: App | null
}

type AppsAction =
  | { type: 'FETCH_APPS_START' }
  | { type: 'FETCH_APPS_SUCCESS'; payload: App[] }
  | { type: 'FETCH_APPS_ERROR'; payload: string }
  | { type: 'CREATE_APP'; payload: App }
  | { type: 'UPDATE_APP'; payload: { id: string; updates: Partial<App> } }
  | { type: 'DELETE_APP'; payload: string }
  | { type: 'SET_CURRENT_APP'; payload: App | null }

const appsReducer = (state: AppsState, action: AppsAction): AppsState => {
  switch (action.type) {
    case 'FETCH_APPS_START':
      return { ...state, loading: true, error: null }
    
    case 'FETCH_APPS_SUCCESS':
      return { ...state, loading: false, apps: action.payload }
    
    case 'FETCH_APPS_ERROR':
      return { ...state, loading: false, error: action.payload }
    
    case 'CREATE_APP':
      return { ...state, apps: [action.payload, ...state.apps] }
    
    case 'UPDATE_APP':
      return {
        ...state,
        apps: state.apps.map(app =>
          app.id === action.payload.id
            ? { ...app, ...action.payload.updates }
            : app
        )
      }
    
    case 'DELETE_APP':
      return {
        ...state,
        apps: state.apps.filter(app => app.id !== action.payload)
      }
    
    case 'SET_CURRENT_APP':
      return { ...state, currentApp: action.payload }
    
    default:
      return state
  }
}

export const AppsProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appsReducer, {
    apps: [],
    loading: false,
    error: null,
    currentApp: null
  })

  const fetchApps = useCallback(async () => {
    dispatch({ type: 'FETCH_APPS_START' })
    
    try {
      const response = await apiClient.get('/apps')
      dispatch({ type: 'FETCH_APPS_SUCCESS', payload: response.data })
    } catch (error) {
      dispatch({ type: 'FETCH_APPS_ERROR', payload: error.message })
    }
  }, [])

  const createApp = useCallback(async (appData: Omit<App, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiClient.post('/apps', appData)
      dispatch({ type: 'CREATE_APP', payload: response.data })
      return response.data
    } catch (error) {
      throw new Error('Failed to create app')
    }
  }, [])

  const updateApp = useCallback(async (id: string, updates: Partial<App>) => {
    try {
      const response = await apiClient.patch(`/apps/${id}`, updates)
      dispatch({ type: 'UPDATE_APP', payload: { id, updates: response.data } })
      return response.data
    } catch (error) {
      throw new Error('Failed to update app')
    }
  }, [])

  const deleteApp = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/apps/${id}`)
      dispatch({ type: 'DELETE_APP', payload: id })
    } catch (error) {
      throw new Error('Failed to delete app')
    }
  }, [])

  const setCurrentApp = useCallback((app: App | null) => {
    dispatch({ type: 'SET_CURRENT_APP', payload: app })
  }, [])

  const value = {
    ...state,
    fetchApps,
    createApp,
    updateApp,
    deleteApp,
    setCurrentApp
  }

  return (
    <AppsContext.Provider value={value}>
      {children}
    </AppsContext.Provider>
  )
}
```

---

## 📱 Mobile-First Responsive Patterns

### 1. **Responsive Component Pattern**
```typescript
// src/components/shared/responsive-grid.tsx
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
}

export const ResponsiveGrid = ({ children, className }: ResponsiveGridProps) => {
  return (
    <div className={cn(
      // Mobile-first grid
      "grid grid-cols-1 gap-4",
      // Tablet
      "sm:grid-cols-2 sm:gap-6",
      // Desktop
      "lg:grid-cols-3 lg:gap-8",
      // Large desktop
      "xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  )
}

// Usage with responsive cards
<ResponsiveGrid>
  {apps.map(app => (
    <Card key={app.id} className="w-full">
      <CardHeader>
        <h3 className="text-lg font-semibold truncate">{app.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {app.description}
        </p>
      </CardHeader>
      <CardContent>
        <Badge variant={app.status === 'completed' ? 'success' : 'secondary'}>
          {app.status}
        </Badge>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          Edit
        </Button>
        <Button size="sm">
          Deploy
        </Button>
      </CardFooter>
    </Card>
  ))}
</ResponsiveGrid>
```

### 2. **Mobile Navigation Pattern**
```typescript
// src/components/layout/mobile-nav.tsx
export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-accent"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 h-full w-64 bg-background border-r"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button onClick={() => setIsOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="p-4 space-y-2">
                <NavLink to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Home className="h-4 w-4 mr-3" />
                  Dashboard
                </NavLink>
                <NavLink to="/apps" onClick={() => setIsOpen(false)}>
                  <Code className="h-4 w-4 mr-3" />
                  My Apps
                </NavLink>
                <NavLink to="/templates" onClick={() => setIsOpen(false)}>
                  <FileTemplate className="h-4 w-4 mr-3" />
                  Templates
                </NavLink>
                <NavLink to="/settings" onClick={() => setIsOpen(false)}>
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </NavLink>
              </nav>
              
              {user && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

This documentation provides a comprehensive overview of the frontend patterns used in the Stich Production project, making it easy to understand, clone, and adapt the codebase for different requirements.