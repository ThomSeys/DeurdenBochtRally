# Context & Provider Usage Guide

All contexts are now integrated into the app via [root.tsx](apps/web/app/root.tsx). Here's how to use them:

## 1. AuthContext

Provides user authentication state throughout the app.

### Available Hooks:
- `useAuth()` - Full auth context with user, participant, isAdmin, isAuthenticated
- `useUser()` - Just the user object
- `useIsAdmin()` - Boolean indicating admin status
- `useIsAuthenticated()` - Boolean indicating if user is logged in

### Example Usage:
```tsx
import { useAuth, useUser, useIsAdmin } from "~/contexts/AuthContext";

function MyComponent() {
  // Get full context
  const { user, participant, isAdmin } = useAuth();
  
  // Or use convenience hooks
  const user = useUser();
  const isAdmin = useIsAdmin();
  
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome, {participant?.first_name}!</div>;
}
```

## 2. ToastContext

Centralized notification system with success, error, info, and warning types.

### Available Hooks:
- `useToast()` - Full toast context with all methods

### Example Usage:
```tsx
import { useToast } from "~/contexts/ToastContext";

function MyComponent() {
  const { success, error, info, warning } = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      success("Data saved successfully!");
    } catch (err) {
      error("Failed to save data");
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

### Methods:
- `success(message, duration?)` - Green success toast
- `error(message, duration?)` - Red error toast
- `info(message, duration?)` - Blue info toast
- `warning(message, duration?)` - Yellow warning toast
- `showToast(type, message, duration?)` - Generic toast
- `hideToast(id)` - Manually dismiss a toast

Default duration is 5000ms (5 seconds). Set to 0 for persistent toast.

## 3. ModalContext

Programmatic modal system for dialogs and confirmations.

### Available Hooks:
- `useModal()` - Full modal context

### Example Usage:
```tsx
import { useModal } from "~/contexts/ModalContext";

function MyComponent() {
  const { openModal, closeModal } = useModal();
  
  const showConfirmation = () => {
    const modalId = openModal({
      title: "Confirm Action",
      content: (
        <div>
          <p>Are you sure you want to proceed?</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => {
              handleConfirm();
              closeModal(modalId);
            }}>
              Yes
            </button>
            <button onClick={() => closeModal(modalId)}>
              Cancel
            </button>
          </div>
        </div>
      ),
      closeOnBackdrop: true,
      closeOnEscape: true,
    });
  };
  
  return <button onClick={showConfirmation}>Delete</button>;
}
```

### Modal Config:
- `title?` - Modal header title
- `content` - React component/element to display
- `onClose?` - Callback when modal closes
- `closeOnBackdrop?` - Allow closing by clicking outside (default: true)
- `closeOnEscape?` - Allow closing with Escape key (default: true)

## 4. RealtimeContext

Supabase realtime subscriptions for live updates.

### Available Hooks:
- `useRealtime()` - Full realtime context
- `useRealtimeEmergencyAlerts(callback)` - Subscribe to emergency_sos changes
- `useRealtimeCheckIns(callback)` - Subscribe to rally_zone_checkins changes
- `useRealtimePhotos(callback)` - Subscribe to participant_photos changes

### Example Usage:
```tsx
import { useRealtimeEmergencyAlerts } from "~/contexts/RealtimeContext";
import { useToast } from "~/contexts/ToastContext";

function AdminDashboard() {
  const { warning } = useToast();
  
  useRealtimeEmergencyAlerts((payload) => {
    if (payload.eventType === "INSERT") {
      warning(`New emergency alert: ${payload.new.message}`);
    }
  });
  
  return <div>Admin Dashboard</div>;
}
```

### Custom Subscriptions:
```tsx
import { useRealtime } from "~/contexts/RealtimeContext";
import { useEffect } from "react";

function MyComponent() {
  const { subscribe } = useRealtime();
  
  useEffect(() => {
    const unsubscribe = subscribe(
      "ride_stories",
      "INSERT",
      (payload) => {
        console.log("New blog post!", payload.new);
      }
    );
    
    return unsubscribe;
  }, [subscribe]);
  
  return <div>Content</div>;
}
```

## 5. AppStateContext

App-level state including online status, service worker, and notifications.

### Available Hooks:
- `useAppState()` - Full app state context
- `useOnlineStatus()` - Boolean for online/offline status
- `useServiceWorker()` - Service worker registration info
- `useNotifications()` - Notification permission state

### Example Usage:
```tsx
import { useOnlineStatus, useNotifications } from "~/contexts/AppStateContext";

function MyComponent() {
  const isOnline = useOnlineStatus();
  const { notificationPermission, requestNotificationPermission } = useNotifications();
  
  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      console.log("Notifications enabled!");
    }
  };
  
  return (
    <div>
      {!isOnline && <div className="warning">You are offline</div>}
      {notificationPermission === "default" && (
        <button onClick={handleEnableNotifications}>
          Enable Notifications
        </button>
      )}
    </div>
  );
}
```

## Migration Tips

### Replacing getUser() calls:
**Before:**
```tsx
const { user } = await getUser(request);
```

**After (in component):**
```tsx
const user = useUser();
// or
const { user, participant } = useAuth();
```

### Replacing actionData success/error messages:
**Before:**
```tsx
export async function action() {
  try {
    await doSomething();
    return { success: "Done!" };
  } catch (error) {
    return { error: "Failed!" };
  }
}

function Component() {
  const actionData = useActionData<typeof action>();
  return (
    <>
      {actionData?.success && <div>{actionData.success}</div>}
      {actionData?.error && <div>{actionData.error}</div>}
    </>
  );
}
```

**After:**
```tsx
export async function action() {
  try {
    await doSomething();
    return { success: true };
  } catch (error) {
    return { error: true };
  }
}

function Component() {
  const { success, error } = useToast();
  const actionData = useActionData<typeof action>();
  
  useEffect(() => {
    if (actionData?.success) success("Done!");
    if (actionData?.error) error("Failed!");
  }, [actionData]);
  
  return <div>Content</div>;
}
```

## Benefits

1. **AuthContext** - Eliminates redundant `getUser()` calls across routes
2. **ToastContext** - Consistent notification UI without scattered conditional renders
3. **ModalContext** - Programmatic modals without managing state in every component
4. **RealtimeContext** - Centralized realtime subscriptions with automatic cleanup
5. **AppStateContext** - Single source of truth for app-level state

All contexts are available throughout the entire app via the provider tree in [root.tsx](apps/web/app/root.tsx).
