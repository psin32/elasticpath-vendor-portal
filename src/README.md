# Elastic Path Admin Portal - Source Code

This directory contains the complete source code for the Elastic Path Admin Portal, organized in a modular and maintainable structure.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx            # Main page component
├── components/             # React Components
│   ├── index.ts            # Component exports
│   ├── Dashboard.tsx       # Main dashboard container
│   ├── DashboardHeader.tsx # Header with org/store selectors
│   ├── DashboardContent.tsx # Content area component
│   ├── SidebarNavigation.tsx # Sidebar navigation
│   ├── OrganizationSelector.tsx # Reusable org selector
│   ├── StoreSelector.tsx   # Reusable store selector
│   ├── OrganizationsList.tsx # Organizations list component
│   ├── StoresList.tsx      # Stores list component
│   ├── LoginForm.tsx       # Login form component
│   └── EpccDemo.tsx        # API demo component
├── hooks/                  # Custom React Hooks
│   ├── index.ts            # Hook exports
│   ├── useDashboard.ts     # Dashboard state management
│   ├── useEpccClient.ts    # EPCC client hook
│   └── useEpccApi.ts       # EPCC API hook
├── contexts/               # React Contexts
│   └── AuthContext.tsx     # Authentication context
├── types/                  # TypeScript Type Definitions
│   ├── index.ts            # Type exports
│   ├── auth.ts             # Authentication types
│   └── dashboard.ts        # Dashboard-specific types
├── lib/                    # Library Configurations
│   └── epcc-client.ts      # EPCC client configuration
├── utils/                  # Utility Functions
├── constants/              # Application Constants
└── examples/               # Usage Examples
    └── epcc-hooks-usage.md # EPCC hooks usage documentation
```

## 🏗️ Architecture Overview

### **Component Hierarchy**
```
Dashboard (Main Container)
├── DashboardHeader (Header with Selectors)
│   ├── OrganizationSelector
│   └── StoreSelector
├── SidebarNavigation (Conditional)
└── DashboardContent (Main Content)
    ├── OrganizationsList
    ├── StoresList
    └── Section-specific content
```

### **State Management**
- **useDashboard Hook**: Centralized dashboard state management
- **AuthContext**: Global authentication state
- **localStorage**: Persistence for user selections

### **Data Flow**
```
useDashboard Hook
    ↓ (state & handlers)
Dashboard Component
    ↓ (props)
DashboardHeader + DashboardContent
    ↓ (props)
Individual Components (Selectors, Lists, etc.)
```

## 🎯 Key Features

### **Authentication**
- ✅ OAuth 2.0 Password Grant
- ✅ Token management with refresh tokens
- ✅ User data fetching
- ✅ Organizations and stores loading

### **Dashboard Functionality**
- ✅ Organization selection with search
- ✅ Store selection with filtering
- ✅ Dynamic sidebar navigation
- ✅ Section-based content rendering
- ✅ State persistence across sessions

### **EPCC Integration**
- ✅ Elastic Path JS SDK integration
- ✅ Custom hooks for API interactions
- ✅ Organization and store-specific API calls
- ✅ Error handling and loading states

## 🔧 Development

### **Adding New Components**
1. Create component in `src/components/`
2. Add TypeScript interfaces in `src/types/`
3. Export from `src/components/index.ts`
4. Import and use in parent components

### **Adding New Hooks**
1. Create hook in `src/hooks/`
2. Add to `src/hooks/index.ts`
3. Use in components as needed

### **Adding New Types**
1. Create type file in `src/types/`
2. Export from `src/types/index.ts`
3. Import where needed

### **Adding New Dashboard Sections**
1. Update `DashboardSection` type in `src/types/dashboard.ts`
2. Add section to `SidebarNavigation.tsx`
3. Add content rendering in `DashboardContent.tsx`
4. Update `useDashboard` hook if needed

## 📦 Module Exports

### **Components**
```typescript
import { Dashboard, DashboardHeader, OrganizationSelector } from '@/components';
```

### **Hooks**
```typescript
import { useDashboard, useEpccClient, useEpccApi } from '@/hooks';
```

### **Types**
```typescript
import { DashboardSection, StoreFilterMode, User } from '@/types';
```

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   ```env
   NEXT_PUBLIC_EPCC_ENDPOINT_URL=your-epcc-endpoint
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 🧪 Testing

The modular structure makes it easy to test individual components:

```typescript
// Test individual components
import { render, screen } from '@testing-library/react';
import { OrganizationSelector } from '@/components';

test('OrganizationSelector renders correctly', () => {
  render(<OrganizationSelector {...props} />);
  expect(screen.getByText('Select Organization')).toBeInTheDocument();
});
```

## 📝 Best Practices

1. **Component Design**: Single responsibility, reusable components
2. **State Management**: Use custom hooks for complex state
3. **Type Safety**: Proper TypeScript interfaces for all components
4. **Error Handling**: Graceful error states and loading indicators
5. **Performance**: Use React.memo and useMemo where appropriate
6. **Accessibility**: Proper ARIA labels and keyboard navigation

## 🔄 Future Enhancements

- [ ] Add unit tests for all components
- [ ] Implement error boundaries
- [ ] Add more dashboard sections (Products, Orders, etc.)
- [ ] Implement real-time updates
- [ ] Add user preferences and settings
- [ ] Implement advanced filtering and sorting
- [ ] Add export functionality
- [ ] Implement role-based access control 