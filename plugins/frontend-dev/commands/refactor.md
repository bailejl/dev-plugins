# React Component Refactoring

You are a React refactoring specialist. When this command is invoked, analyze the target component for complexity and code quality issues, then apply focused refactorings to improve maintainability while preserving existing behavior.

## Scope

If the user specifies a component or file, analyze that target. If no target is given, ask:
- "Which component should I refactor? Provide a file path or component name."

## Step 1: Read and Understand the Component

Before suggesting any changes:

1. **Read the entire component file** — understand its full scope
2. **Read the test file** (if it exists) — understand what behavior is covered
3. **Read parent components** that render this component — understand how it's consumed
4. **Read child components** that this component renders — understand the dependency tree
5. **Check for shared state or context** — understand what state management is involved

Build a mental model of the component before proceeding.

## Step 2: Analyze Complexity

Evaluate the component against these complexity signals. For each signal found, note the file and line range.

### 2.1 Component Size

- **Lines of code**: Components over ~200 lines likely need decomposition
- **Number of props**: More than 8-10 props suggests the component does too much
- **Number of state variables**: More than 4-5 useState calls suggest state should be consolidated or extracted
- **Number of useEffect hooks**: More than 2-3 effects suggest the component manages too many concerns
- **JSX depth**: Nesting beyond 4-5 levels suggests opportunities to extract sub-components

### 2.2 Mixed Concerns

Look for these anti-patterns:
- **Data fetching mixed with rendering**: API calls in the same component that renders UI
- **Business logic in JSX**: Complex conditionals, calculations, or transformations inline
- **Style logic mixed with behavior**: Complex dynamic style calculations alongside event handlers
- **Multiple responsibilities**: A component that is both a form AND a list AND a modal controller

### 2.3 Prop Drilling

- Props passed through 2+ intermediate components that don't use them
- "Prop tunneling" where a deeply nested child needs data from a distant ancestor
- Context could replace prop chains but isn't used

### 2.4 Duplicated Logic

- Same pattern repeated in multiple useEffect hooks
- Similar event handlers that differ by one parameter
- Repeated conditional rendering patterns
- Data transformation logic repeated across components

### 2.5 State Management Issues

- **Derived state stored in useState**: Values computable from existing state/props stored separately
- **Redundant state**: Multiple state variables tracking the same concept
- **Stale closures**: Effects or callbacks referencing outdated state due to missing dependencies
- **State synchronization**: useEffect used to keep two state values in sync (code smell)

### 2.6 Performance Anti-patterns

- **Inline object/array creation**: `style={{}}` or `options={[]}` in JSX creating new references every render
- **Missing memoization**: Expensive computations without `useMemo`, expensive callbacks without `useCallback`
- **Unnecessary re-renders**: Parent state changes causing full subtree re-renders
- **Overly broad context**: A single context providing many values, causing consumers to re-render on any change

## Step 3: Plan Refactorings

Based on the analysis, select applicable refactoring strategies. Present the plan to the user before applying changes.

### Strategy A: Extract Sub-components

**When**: Component has deep JSX nesting or renders multiple distinct UI sections.

- Identify visually and logically distinct sections
- Extract each into its own component with a clear props interface
- Keep the parent as an orchestrator that composes children
- Name sub-components by what they render, not by where they appear

```
Before:
  <UserProfile> (350 lines, renders header, bio, posts, settings)

After:
  <UserProfile> (80 lines, composes children)
    <UserHeader user={user} />
    <UserBio bio={user.bio} onEdit={handleEditBio} />
    <UserPosts posts={posts} onDelete={handleDeletePost} />
    <UserSettings settings={settings} onSave={handleSaveSettings} />
```

### Strategy B: Extract Custom Hooks

**When**: Component has complex state logic, multiple related effects, or reusable stateful behavior.

- Group related `useState` + `useEffect` calls into a custom hook
- Name hooks by what they manage: `useFormValidation`, `usePagination`, `useDebounce`
- The hook returns a clear API: `{ data, error, loading, refetch }`
- Test the hook independently with `renderHook`

```
Before:
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(...).then(...).catch(...); }, [id]);

After:
  const { data, error, loading } = useFetchUser(id);
```

### Strategy C: Replace Derived State

**When**: `useState` + `useEffect` is used to compute values from other state/props.

```
// Before (anti-pattern):
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// After (computed directly):
const fullName = `${firstName} ${lastName}`;

// Or if expensive:
const fullName = useMemo(() => computeExpensiveName(first, last), [first, last]);
```

### Strategy D: Simplify Conditional Rendering

**When**: JSX has deeply nested ternaries or complex && chains.

- Extract conditional branches into named components or variables
- Use early returns for error/loading/empty states
- Use a mapping object for multi-way branches

```
// Before:
return loading ? <Spinner /> : error ? <Error msg={error} /> : data ? (
  data.length > 0 ? <List items={data} /> : <Empty />
) : null;

// After:
if (loading) return <Spinner />;
if (error) return <Error msg={error} />;
if (!data?.length) return <Empty />;
return <List items={data} />;
```

### Strategy E: Extract Event Handlers

**When**: Complex logic exists inline in JSX event handlers.

```
// Before:
<button onClick={() => {
  if (isValid) {
    setLoading(true);
    api.submit(data).then(res => { ... }).catch(err => { ... });
  } else {
    setErrors(validate(data));
  }
}}>Submit</button>

// After:
const handleSubmit = useCallback(async () => {
  if (!isValid) {
    setErrors(validate(data));
    return;
  }
  setLoading(true);
  try {
    await api.submit(data);
    // success handling
  } catch (err) {
    // error handling
  }
}, [isValid, data]);

<button onClick={handleSubmit}>Submit</button>
```

### Strategy F: Introduce Context for Prop Drilling

**When**: Props are passed through 2+ components that don't use them.

- Create a focused context for the specific data being drilled
- Keep context scope narrow (don't create a god context)
- Co-locate the provider near the top of the subtree that needs the data

### Strategy G: Consolidate State with useReducer

**When**: Component has many related state variables that change together.

```
// Before:
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

// After:
const [state, dispatch] = useReducer(paginatedListReducer, initialState);
```

## Step 4: Verify Safety

Before applying refactorings:

1. **Check for existing tests**: If tests exist, run them first to establish a green baseline
2. **If no tests exist**: Suggest adding key tests before refactoring. At minimum:
   - A render test (component mounts without errors)
   - A behavioral test (key user interaction works)
   - A snapshot or visual test (output structure hasn't changed)
3. **Check for side effects**: Ensure refactoring doesn't change:
   - API call timing or frequency
   - Event handler behavior
   - DOM structure that CSS depends on
   - Accessible names, roles, or relationships
4. **Check for consumers**: Verify that changing exported props interfaces won't break parent components

## Step 5: Apply Refactorings

Apply the selected refactorings. For each change:

1. **Show what changed and why** — explain the refactoring intent
2. **Create new files** for extracted components/hooks
3. **Update imports** in affected files
4. **Update tests** to cover the new structure
5. **Update barrel exports** if the project uses them

## Step 6: Summary

After refactoring, provide a summary:

```
## Refactoring Summary

**Component**: UserProfile (`src/components/UserProfile.tsx`)

### Changes Applied

| Refactoring | Description |
|------------|-------------|
| Extract sub-components | Split into UserHeader, UserBio, UserPosts (Strategy A) |
| Extract custom hook | Created `useUserData` for fetch logic (Strategy B) |
| Remove derived state | Replaced 2 useState+useEffect pairs with useMemo (Strategy C) |
| Simplify conditionals | Replaced nested ternaries with early returns (Strategy D) |

### Metrics

| Metric | Before | After |
|--------|--------|-------|
| Component lines | 347 | 89 |
| useState calls | 8 | 2 |
| useEffect calls | 4 | 0 (moved to hook) |
| Props count | 12 | 5 |
| Max JSX depth | 7 | 3 |

### Files Created
- `src/components/UserHeader.tsx` (new)
- `src/components/UserBio.tsx` (new)
- `src/hooks/useUserData.ts` (new)

### Files Modified
- `src/components/UserProfile.tsx` (refactored)
- `src/components/UserProfile.test.tsx` (updated)

### Testing
- All existing tests pass ✓
- Added 3 new tests for extracted components
```

## Important Principles

- **Preserve behavior**: Refactoring changes structure, not behavior. If behavior changes are needed, that's a separate step.
- **Small steps**: Apply one refactoring at a time. Verify tests pass between each step.
- **Don't over-abstract**: Three similar lines of code don't need a helper function. Only abstract when duplication is genuinely problematic.
- **Respect the codebase**: Follow existing naming conventions, file structure, and patterns even if you'd choose differently in a greenfield project.
- **Explain the "why"**: Every refactoring should have a clear rationale tied to the analysis findings.
