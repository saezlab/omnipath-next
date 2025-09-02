# Sidebar Layout Implementation Plan

## Overview
Transform the current top navigation layout to a sidebar-based navigation layout using shadcn/ui's sidebar component. This will provide better organization for navigation, history (combined chat and search), and future feature expansion.

## Current Structure Analysis

### Existing Components
- **Top Navigation**: `SiteHeader` with `MainNav` component
- **Main Navigation Items**: Interactions, Annotations, Chat
- **Combined History**: Search history includes both searches and chat sessions in one dropdown
- **Theme Toggle**: In the header
- **Chat Layout**: Uses `SiteLayout` wrapper with header
- **New Chat Button**: Currently inside the chat component

### Key Features to Migrate
1. Navigation links (Interactions, Annotations, Chat)
2. Combined history functionality (searches and chats together)
3. Theme toggle
4. Logo and branding
5. New chat button (conditionally shown only on /chat route)

## Implementation Steps

### Phase 1: Install and Setup Sidebar Component

#### 1.1 Install Sidebar Component
```bash
npx shadcn@latest add sidebar
```
This will:
- Add `sidebar.tsx` to `/src/components/ui/`
- Ensure sidebar CSS variables are in `globals.css` (already present)

#### 1.2 Install Required Dependencies
```bash
npx shadcn@latest add collapsible
```
(If not already installed)

### Phase 2: Create Sidebar Structure

#### 2.1 Create `app-sidebar.tsx`
Location: `/src/components/layout/app-sidebar.tsx`

**Structure:**
```
Sidebar
├── SidebarHeader
│   ├── Logo & Brand
│   └── User Menu (optional)
├── SidebarContent
│   ├── SidebarGroup (Navigation)
│   │   ├── Interactions
│   │   ├── Annotations
│   │   └── Chat
│   ├── SidebarSeparator
│   ├── New Chat Button (conditionally rendered when pathname === '/chat')
│   ├── SidebarSeparator (conditional)
│   └── SidebarGroup (Combined History)
│       ├── Header with "Recent" label and Clear button
│       └── List of history items (searches + chats)
│           ├── Chat items with MessageSquare icon
│           └── Search items with Search icon
└── SidebarFooter
    └── Theme Toggle
```

**Key Features:**
- **Logo/Branding**: Move from header to sidebar header
- **Main Navigation**: Use `SidebarMenu` with icons and labels
- **New Chat Button**: 
  - Only visible when on `/chat` route
  - Prominent button below navigation
  - Uses existing `NewChatButton` component
- **Combined History**: 
  - Single collapsible group for all history
  - Mix of chat sessions and search queries
  - Maintains existing badge colors and icons
  - Shows relative timestamps
  - Clear all functionality
- **Theme Toggle**: Move to sidebar footer

#### 2.2 Update Root Layout
Location: `/src/app/layout.tsx`

**Changes:**
- Add `SidebarProvider` wrapper
- Remove `SiteHeader` component
- Add `SidebarInset` for main content

**New Structure:**
```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <main>
      <SidebarTrigger />
      {children}
    </main>
  </SidebarInset>
</SidebarProvider>
```

### Phase 3: Implement Combined History in Sidebar

#### 3.1 History Section
Migrate the existing combined history from the dropdown to the sidebar:
- Keep the same data structure from `useSearchStore`
- Display both chat sessions and searches in chronological order
- Maintain existing icons:
  - `MessageSquare` for chat items
  - `Search` for search items
- Keep existing badges with type colors:
  - Blue for chat
  - Primary for annotations
  - Secondary for interactions
- Preserve existing functionality:
  - Click to navigate
  - Clear all button
  - Timestamps

#### 3.2 History Item Display
Each history item should show:
- Icon (chat or search)
- Query/title text (truncated if needed)
- Type badge
- Relative timestamp (on hover or always visible)

### Phase 4: Conditional New Chat Button

#### 4.1 Implementation
- Use `usePathname()` hook to detect current route
- Only render New Chat button when `pathname === '/chat'`
- Position prominently below main navigation
- Reuse existing `NewChatButton` component from the chat simplification

#### 4.2 Placement
```tsx
{pathname === '/chat' && (
  <>
    <SidebarSeparator />
    <div className="px-3 py-2">
      <NewChatButton 
        initialMessages={initialMessages}
        variant="default"
        className="w-full"
      />
    </div>
  </>
)}
```

### Phase 5: Migrate Existing Features

#### 5.1 Combined History
- Move entire history logic from header dropdown to sidebar
- Keep all existing functionality intact
- Improve visibility with dedicated sidebar section
- Consider making it collapsible for more space

#### 5.2 Theme Toggle
- Move to sidebar footer
- Keep existing toggle logic
- Maintain current sun/moon icon animation

#### 5.3 Navigation State
- Use `isActive` prop on `SidebarMenuButton`
- Maintain route highlighting
- Keep existing color scheme for active states

### Phase 6: Responsive Design

#### 6.1 Mobile Behavior
- Sidebar as overlay (`offcanvas` mode)
- Hamburger menu trigger
- Auto-close on navigation
- Full-height overlay

#### 6.2 Desktop Behavior
- Collapsible to icon mode
- Persistent state via cookies
- Smooth animations
- Fixed width when expanded

### Phase 7: Clean Up

#### 7.1 Remove Old Components
- Delete `SiteHeader` component
- Delete `MainNav` component  
- Remove `SiteLayout` wrapper
- Update `chat-layout.tsx` or remove if unnecessary

#### 7.2 Update Imports
- Update all page components that use `SiteLayout`
- Remove unused imports
- Update any components that reference the old header

## File Changes Summary

### New Files
1. `/src/components/ui/sidebar.tsx` (from shadcn)
2. `/src/components/layout/app-sidebar.tsx`

### Modified Files
1. `/src/app/layout.tsx` - Add SidebarProvider
2. `/src/app/chat/page.tsx` - Remove SiteLayout wrapper
3. `/src/app/page.tsx` - Update layout structure
4. `/src/app/interactions/page.tsx` - Remove SiteLayout wrapper (if exists)
5. `/src/app/annotations/page.tsx` - Remove SiteLayout wrapper (if exists)
6. `/src/components/ai/chat.tsx` - Remove NewChatButton (moved to sidebar)

### Deleted Files
1. `/src/components/layout/site-header.tsx`
2. `/src/components/layout/main-nav.tsx`
3. `/src/components/layout/chat-layout.tsx` (if no longer needed)

## Benefits of Sidebar Layout

1. **Better History Visibility**: Combined history always visible, not hidden in dropdown
2. **Contextual Actions**: New Chat button only appears when relevant
3. **Improved Navigation**: Clearer visual hierarchy
4. **Modern Design**: Follows common patterns (ChatGPT, Slack, VS Code)
5. **Persistent State**: Sidebar collapse state saved across sessions
6. **More Screen Space**: Removes top header, giving more vertical space for content

## Implementation Order

1. **Step 1**: Install sidebar component and dependencies
2. **Step 2**: Create app-sidebar with basic navigation
3. **Step 3**: Migrate combined history from dropdown to sidebar
4. **Step 4**: Add conditional New Chat button
5. **Step 5**: Migrate theme toggle to footer
6. **Step 6**: Update root layout with SidebarProvider
7. **Step 7**: Test responsive behavior
8. **Step 8**: Clean up old components

## Key Considerations

### Maintaining Current Functionality
- **Combined History**: Keep searches and chats in one list
- **History Actions**: Preserve clear button and navigation
- **Badge System**: Keep existing type indicators and colors
- **Icons**: Maintain current icon system for visual consistency

### Route-Specific Features
- **New Chat Button**: Only show on `/chat` route
- **Active Navigation**: Highlight current page
- **Context Awareness**: Sidebar adapts based on current route

## Testing Checklist

- [ ] Navigation works on all pages
- [ ] Combined history displays correctly (chats + searches)
- [ ] New chat button only appears on /chat route
- [ ] New chat button creates and navigates correctly
- [ ] History items navigate to correct URLs
- [ ] Clear history works
- [ ] Theme toggle works in new position
- [ ] Mobile responsive behavior (overlay mode)
- [ ] Desktop collapse/expand works
- [ ] Persistent sidebar state via cookies
- [ ] No console errors
- [ ] Keyboard navigation works
- [ ] All existing functionality preserved

## Potential Enhancements (Future)

1. **History Filtering**: Toggle between all/chats/searches
2. **History Search**: Search within history items
3. **Pinned Items**: Pin important chats or searches
4. **Keyboard Shortcuts**: Quick navigation (Cmd+K for search)
5. **History Grouping**: Group by date (Today, Yesterday, This Week)
6. **Export History**: Download history as JSON/CSV
7. **Sidebar Customization**: User-adjustable width