# Refactoring Assessment — MonolithDashboard

## Summary

The `MonolithDashboard` component (`fixtures/messy-component/src/MonolithDashboard.jsx`) is a 310+ line monolithic component that mixes data fetching, state management, filtering/sorting logic, and rendering for multiple views. It requires decomposition into focused, testable components.

## Findings

### Critical

#### 1. Monolithic Component — 310+ Lines

**File**: `MonolithDashboard.jsx` (entire file)
**Severity**: CRITICAL

A single component handles:
- Data fetching for users (lines 32-45)
- Data fetching for posts (lines 48-53)
- Search filtering (lines 56-63)
- Sorting (lines 66-72)
- Document title side effect (lines 75-80)
- Navigation/header rendering (lines 100-133)
- Settings panel rendering (lines 135-156)
- Tab navigation rendering (lines 158-185)
- User list rendering (lines 189-222)
- Post list rendering (lines 224-246)
- User detail panel rendering (lines 249-292)
- Status bar rendering (lines 295-308)

**Impact**: Any change to one concern requires understanding the entire component. Cannot reuse the user list, post list, or settings panel independently. Extremely difficult to test individual behaviors.

---

#### 2. Mixed Concerns — Data Fetching + Rendering + State

**File**: `MonolithDashboard.jsx:19-80`
**Severity**: CRITICAL

The component directly manages 10 pieces of state and 5 side effects:

```jsx
// 10 useState calls (lines 20-29)
const [users, setUsers] = useState([]);
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [filteredUsers, setFilteredUsers] = useState([]);
const [selectedUser, setSelectedUser] = useState(null);
const [showSettings, setShowSettings] = useState(false);
const [sortOrder, setSortOrder] = useState('asc');
const [activeTab, setActiveTab] = useState('users');
```

Data fetching, filtering, sorting, and UI state are all interleaved in a flat list. There's no separation between server state, derived state, and UI state.

**Recommended separation**:
- **Server state**: `users`, `posts`, `loading`, `error` → custom hook `useApiData()` or React Query
- **Derived state**: `filteredUsers` → computed via `useMemo`
- **UI state**: `selectedUser`, `showSettings`, `sortOrder`, `activeTab`, `searchTerm` → component-level state or `useReducer`

---

### High

#### 3. Derived State Anti-Pattern — `MonolithDashboard.jsx:56-72`

**File**: `MonolithDashboard.jsx:56-63, 66-72`
**Severity**: HIGH

`filteredUsers` is stored in state and synchronized via `useEffect`:

```jsx
// line 25: Unnecessary state
const [filteredUsers, setFilteredUsers] = useState([]);

// lines 56-63: Sync filter effect
useEffect(() => {
  const result = users.filter(
    (user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || ...
  );
  setFilteredUsers(result);
}, [users, searchTerm]);

// lines 66-72: Sync sort effect (also mutates filteredUsers)
useEffect(() => {
  const sorted = [...filteredUsers].sort(...);
  setFilteredUsers(sorted);
}, [sortOrder]);
```

This causes:
- Double renders: one for the state change, one for the effect
- Missing dependency: the sort effect depends on `filteredUsers` but also writes to it, creating a potential loop
- Race condition: changing `searchTerm` and `sortOrder` simultaneously can produce inconsistent results

**Fix**: Use `useMemo` to derive the filtered and sorted list:

```jsx
const filteredUsers = useMemo(() => {
  return users
    .filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );
}, [users, searchTerm, sortOrder]);
```

---

#### 4. Duplicated Rendering Patterns — `MonolithDashboard.jsx:189-246`

**File**: `MonolithDashboard.jsx:189-222, 224-246`
**Severity**: HIGH

The user list and post list have nearly identical rendering structures:

```jsx
// User list pattern (lines 189-222)
{filteredUsers.length === 0 ? (
  <p>No users found...</p>
) : (
  <div style={{ display: 'grid', gap: '12px' }}>
    {filteredUsers.map((user) => (
      <div key={user.id} style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        ...
      </div>
    ))}
  </div>
)}

// Post list pattern (lines 224-246) — same structure
{posts.length === 0 ? (
  <p>No posts available.</p>
) : (
  <div style={{ display: 'grid', gap: '12px' }}>
    {posts.slice(0, 20).map((post) => (
      <div key={post.id} style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        ...
      </div>
    ))}
  </div>
)}
```

The empty state, grid wrapper, and card styling are duplicated.

**Fix**: Extract a shared `<CardList>` component or at minimum extract `<UserCard>` and `<PostCard>` components.

---

#### 5. Hardcoded API URLs — `MonolithDashboard.jsx:34, 49`

**File**: `MonolithDashboard.jsx:34, 49`
**Severity**: HIGH

```jsx
fetch('https://jsonplaceholder.typicode.com/users')
fetch('https://jsonplaceholder.typicode.com/posts')
```

API base URLs are hardcoded in the component. Cannot switch between environments (dev/staging/prod) without modifying component code.

**Fix**: Use an environment variable or API client:
```jsx
const API_BASE = import.meta.env.VITE_API_URL || 'https://jsonplaceholder.typicode.com';
fetch(`${API_BASE}/users`)
```

---

### Medium

#### 6. Deep JSX Nesting — `MonolithDashboard.jsx:100-308`

**File**: `MonolithDashboard.jsx:100-308`
**Severity**: MEDIUM

The return statement contains 7+ levels of JSX nesting with complex conditional rendering. The main content area is particularly deep: `div > div > div > {conditional} > div > div > {map} > div > div`.

**Impact**: Extremely difficult to trace which closing tag corresponds to which opening tag. Makes code review and modification error-prone.

---

## Recommended Decomposition

Extract the monolith into these focused components:

```
MonolithDashboard.jsx (310 lines)
  ├── hooks/
  │   ├── useUsers.js          — fetch users, handle loading/error
  │   └── usePosts.js          — fetch posts, handle loading/error
  ├── components/
  │   ├── DashboardHeader.jsx  — title, search, sort toggle, settings button
  │   ├── SettingsPanel.jsx    — settings checkboxes and close button
  │   ├── TabNavigation.jsx    — users/posts tab switcher
  │   ├── UserList.jsx         — filtered/sorted user grid
  │   ├── UserCard.jsx         — individual user card
  │   ├── PostList.jsx         — posts grid
  │   ├── PostCard.jsx         — individual post card
  │   ├── UserDetail.jsx       — selected user sidebar panel
  │   └── StatusBar.jsx        — footer with counts
  └── Dashboard.jsx            — composition root (~40 lines)
```

### Extraction Priority

1. **Custom hooks** (`useUsers`, `usePosts`): Extract data fetching first to separate server state from UI.
2. **Replace derived state**: Convert `filteredUsers` from `useState` + `useEffect` to `useMemo`.
3. **Extract leaf components**: `UserCard`, `PostCard`, `UserDetail`, `StatusBar` — these have no children and are easy to extract.
4. **Extract container components**: `UserList`, `PostList`, `DashboardHeader` — these compose leaf components.
5. **Compose in Dashboard**: The root component becomes a thin orchestrator.

### Expected Result

The refactored `Dashboard.jsx` should be ~40 lines:

```jsx
function Dashboard() {
  const { users, loading, error } = useUsers();
  const { posts } = usePosts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  const filteredUsers = useMemo(() => { /* filter + sort */ }, [users, searchTerm, sortOrder]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <DashboardLayout>
      <DashboardHeader searchTerm={searchTerm} onSearch={setSearchTerm} ... />
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} ... />
      <MainContent>
        {activeTab === 'users' && <UserList users={filteredUsers} onSelect={setSelectedUser} />}
        {activeTab === 'posts' && <PostList posts={posts} />}
      </MainContent>
      {selectedUser && <UserDetail user={selectedUser} posts={posts} onClose={() => setSelectedUser(null)} />}
      <StatusBar userCount={users.length} postCount={posts.length} filteredCount={filteredUsers.length} />
    </DashboardLayout>
  );
}
```

---

*Report generated by frontend-dev:review*
