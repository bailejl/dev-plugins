---
name: react-patterns
description: React hooks, composition patterns, state management, and performance optimization reference. Use when reviewing, scaffolding, or refactoring React components.
user-invocable: false
---

# React Patterns Knowledge Base

Reference guide for React patterns, hooks, composition strategies, state management, and performance optimization. Use this knowledge when reviewing, scaffolding, or refactoring React components.

---

## Hooks

### useState

Manages local component state.

```tsx
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);
```

**Guidelines:**
- Initialize with the correct type — `useState<string[]>([])` not `useState([])`
- Use functional updates when new state depends on previous: `setCount(c => c + 1)`
- Don't store derived values in state — compute them directly or with `useMemo`
- Don't store props in state unless the component needs to "fork" the value
- Prefer a single `useReducer` over 4+ related `useState` calls

### useEffect

Synchronizes a component with an external system (APIs, subscriptions, DOM).

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetchData(id, { signal: controller.signal }).then(setData);
  return () => controller.abort();
}, [id]);
```

**Guidelines:**
- Every effect should synchronize with an external system — if it only transforms state, it's probably unnecessary
- Always include a cleanup function for subscriptions, timers, and fetch requests
- List all reactive values in the dependency array — never lie about dependencies
- Don't use effects to "respond" to user events — use event handlers
- Don't use effects to initialize state from props — use initializer functions: `useState(() => computeInitial(props))`
- If you're using an effect to keep two state values in sync, you probably need derived state instead

### useCallback

Memoizes a function reference to prevent unnecessary re-renders of children.

```tsx
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);
```

**Guidelines:**
- Use when passing callbacks to memoized children (`React.memo`)
- Use when a function is a dependency of another hook
- Don't wrap every function — only those that cause measurable re-render issues
- Prefer `useCallback` over inline arrow functions in JSX only when it matters for performance

### useMemo

Memoizes an expensive computation.

```tsx
const sortedItems = useMemo(
  () => items.slice().sort(compareFn),
  [items, compareFn]
);
```

**Guidelines:**
- Use for genuinely expensive computations (sorting large arrays, complex transformations)
- Use to preserve referential identity of objects/arrays passed to memoized children
- Don't use for trivial computations — the memoization overhead isn't worth it
- If you're unsure whether something is expensive, measure first with React DevTools Profiler

### useRef

Holds a mutable value that doesn't trigger re-renders, or references a DOM element.

```tsx
const inputRef = useRef<HTMLInputElement>(null);
const timerRef = useRef<number | null>(null);
```

**Guidelines:**
- Use for DOM element references (focus, scroll, measure)
- Use for mutable values that shouldn't trigger re-renders (timers, previous values, instance variables)
- Don't read or write `.current` during rendering (except for initialization)
- Use `useRef<T>(null)` for DOM refs, `useRef<T>(initialValue)` for mutable values

### useReducer

Manages complex state with explicit state transitions.

```tsx
type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: Item[] }
  | { type: 'FETCH_ERROR'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, data: action.data };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };
  }
}
```

**Guidelines:**
- Use when state transitions are complex or state variables are interdependent
- Use when the next state depends on the previous state in non-trivial ways
- Define action types as discriminated unions for type safety
- Keep the reducer pure — no side effects, no API calls
- Co-locate the reducer with the component or extract to a separate file if shared

### Custom Hooks

Extract reusable stateful logic into custom hooks.

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
```

**Guidelines:**
- Name must start with `use` to follow rules of hooks
- Should encapsulate a single concern (data fetching, form state, animation, subscription)
- Return a clear API — prefer objects for 3+ return values: `{ data, error, loading }`
- Test hooks independently with `renderHook` from Testing Library
- Document the hook's contract: what it accepts, what it returns, when it re-runs

---

## Component Composition Patterns

### Render Props

Pass a function as a prop (or children) to share stateful logic.

```tsx
<DataFetcher url="/api/users">
  {({ data, loading, error }) => (
    loading ? <Spinner /> : <UserList users={data} />
  )}
</DataFetcher>
```

**When to use**: When the consumer needs full control over rendering. Less common now that hooks exist — prefer custom hooks for most cases.

### Higher-Order Components (HOCs)

Wrap a component to add behavior.

```tsx
function withAuth<P>(Component: React.ComponentType<P>) {
  return function AuthWrapper(props: P) {
    const { user } = useAuth();
    if (!user) return <Redirect to="/login" />;
    return <Component {...props} />;
  };
}
```

**When to use**: Cross-cutting concerns (auth, logging, error boundaries) that apply to many components. Prefer hooks for most cases — HOCs add wrapper elements and can obscure component identity.

### Compound Components

Related components that share implicit state.

```tsx
<Tabs defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs>
```

**When to use**: Component families that share state (tabs, accordions, menus, select). Implement with React Context to share state between compound parts.

### Slot Pattern

Accept named render areas via props.

```tsx
<Card
  header={<CardHeader title="Title" />}
  footer={<CardFooter actions={actions} />}
>
  Card body content
</Card>
```

**When to use**: Layout components with well-defined regions. Clearer than deeply nested children.

### Controlled vs Uncontrolled

```tsx
// Controlled — parent owns the state
<Input value={name} onChange={setName} />

// Uncontrolled — component owns its state
<Input defaultValue="initial" ref={inputRef} />
```

**Guidelines:**
- Form libraries (React Hook Form) prefer uncontrolled for performance
- Use controlled when the parent needs to react to every change
- Support both patterns in reusable components: accept both `value`+`onChange` and `defaultValue`

---

## State Management

### Local State (useState / useReducer)

**Use when**: State is used by one component or its immediate children. This is the default — start here.

### Lifting State Up

**Use when**: Sibling components need the same state. Move state to the nearest common ancestor and pass down via props.

### React Context

**Use when**: State needs to be accessed by deeply nested components (theme, auth, locale). Not a replacement for prop passing in shallow trees.

```tsx
const ThemeContext = createContext<Theme>(defaultTheme);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Guidelines:**
- Split read and write contexts to prevent unnecessary re-renders
- Memoize the context value object to prevent consumer re-renders
- Keep context scope narrow — a `<ThemeProvider>` doesn't need to include `user` and `cart`
- Don't use context for frequently changing values (mouse position, scroll offset)

### External State Libraries

- **Redux / Zustand**: Global application state with selectors for granular subscriptions
- **TanStack Query (React Query)**: Server state management — caching, background refresh, optimistic updates
- **Jotai / Recoil**: Atomic state management — bottom-up, fine-grained subscriptions

Choose based on the type of state:
- **Server state** (API data) → TanStack Query or SWR
- **Client state** (UI state, user preferences) → Context, Zustand, or Jotai
- **Form state** → React Hook Form or Formik
- **URL state** (filters, pagination) → URL search params

---

## Performance Patterns

### React.memo

Prevents re-renders when props haven't changed.

```tsx
const ExpensiveList = React.memo(function ExpensiveList({ items }: Props) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});
```

**Guidelines:**
- Only use when a component re-renders with the same props frequently
- Ineffective if parent creates new objects/arrays/functions on every render (use `useMemo`/`useCallback`)
- Measure before and after with React DevTools Profiler

### Lazy Loading

Split code at route boundaries or for heavy components.

```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
```

### Virtualization

Render only visible items in long lists.

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  // render only virtualizer.getVirtualItems()
}
```

**Use when**: Lists have 100+ items. Don't virtualize short lists — the overhead isn't worth it.

### Key Prop Optimization

```tsx
// Force remount with key change (reset component state)
<UserProfile key={userId} userId={userId} />

// Stable keys for lists (never use array index for reorderable lists)
{items.map(item => <Item key={item.id} item={item} />)}
```

---

## Error Boundaries

Catch rendering errors in a subtree.

```tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logErrorToService(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultErrorUI error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Guidelines:**
- Place error boundaries at route level and around critical leaf components
- Provide a meaningful fallback UI, not just a blank screen
- Log errors to monitoring (Sentry, DataDog, etc.)
- Error boundaries don't catch errors in event handlers, async code, or server-side rendering

---

## Server Components / Client Components (React 19+ / Next.js App Router)

### Server Components (default)
- Run on the server only — can access databases, file system, secrets
- Cannot use hooks, event handlers, or browser APIs
- Reduce client bundle size

### Client Components (`'use client'`)
- Run on the client — can use hooks, state, effects, event handlers
- Add to the client bundle

```tsx
// Server Component (default)
async function UserProfile({ userId }: { userId: string }) {
  const user = await db.users.find(userId); // direct DB access
  return (
    <div>
      <h1>{user.name}</h1>
      <LikeButton userId={userId} /> {/* Client component */}
    </div>
  );
}

// Client Component
'use client';
function LikeButton({ userId }: { userId: string }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>Like</button>;
}
```

**Guidelines:**
- Keep `'use client'` boundaries as low in the tree as possible
- Server components can import client components, not vice versa
- Pass server data to client components via props (serializable only)
- Use `'use server'` for server actions (form mutations)
