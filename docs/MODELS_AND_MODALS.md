# Models and Modals Documentation

## Are we using our models for alert.model.ts and watchlist.model.ts?

**Yes, we are using these models.**

### alert.model.ts
- **Location**: `database/models/alert.model.ts`
- **Purpose**: Defines the MongoDB schema for price alerts using Mongoose
- **Usage**: 
  - Used in `/app/api/alerts/route.ts` for creating and listing alerts
  - Used in `/app/api/alerts/[id]/route.ts` for updating and deleting alerts
  - Stores alert configuration including symbol, operator, threshold, active status, and notes
- **Fields**:
  - `userId`: Links alert to a user
  - `symbol`: Stock symbol (e.g., AAPL, MSFT)
  - `operator`: Comparison operator (>, <, >=, <=, ==)
  - `threshold`: Price threshold for the alert
  - `active`: Boolean indicating if alert is enabled
  - `note`: Optional user note
  - `createdAt`: Creation timestamp
  - `lastTriggeredAt`: Last time the alert was triggered

### watchlist.model.ts
- **Location**: `database/models/watchlist.model.ts`
- **Purpose**: Defines the MongoDB schema for user watchlists using Mongoose
- **Usage**:
  - Used in `lib/actions/watchlist.actions.ts` for all watchlist operations
  - Called by `/app/api/watchlist/route.ts` for GET, POST, and DELETE operations
  - Stores watchlist items with optional financial metrics
- **Fields**:
  - `userId`: Links watchlist item to a user
  - `symbol`: Stock symbol
  - `company`: Company name
  - `addedAt`: Timestamp when added to watchlist
  - `marketCapB`: Market capitalization in billions (optional)
  - `peRatio`: Price-to-Earnings ratio (optional)
  - `alertPrice`: Price alert target (optional)
  - `addedPrice`: Price when stock was added to watchlist (optional)

## What is a Modal and are we using it?

### What is a Modal?

A **modal** (also called a "modal dialog" or "dialog box") is a UI component that appears on top of the main content, typically with an overlay that dims the background. It's used to:
- Focus user attention on a specific task or information
- Require user interaction before returning to the main interface
- Display forms, confirmations, or important messages
- Prevent interaction with the underlying page until dismissed

### Are we using Modals?

**Yes, we are using modals through the Dialog component.**

### Implementation Details

The application uses **Radix UI Dialog** as the modal implementation:

- **Component Location**: `components/ui/dialog.tsx`
- **Library**: `@radix-ui/react-dialog`
- **Wrapper Components**:
  - `Dialog`: Root component
  - `DialogTrigger`: Button/element that opens the dialog
  - `DialogContent`: The modal content container
  - `DialogHeader`: Header section with title
  - `DialogTitle`: Modal title
  - `DialogDescription`: Modal description text
  - `DialogFooter`: Footer section for actions
  - `DialogOverlay`: Semi-transparent backdrop
  - `DialogClose`: Close button

### Where Modals are Used

1. **SearchCommand Component** (`components/SearchCommand.tsx`)
   - Uses Dialog for the stock search interface
   - Triggered by keyboard shortcut or search button
   - Displays searchable list of stocks

2. **Potential Use Cases** (based on project structure):
   - Alert management dialogs (for editing/confirming alert deletion)
   - Watchlist operations (add/remove confirmations)
   - User profile actions

### Modal Features in Our Implementation

- **Accessibility**: Built-in ARIA attributes from Radix UI
- **Animations**: Fade-in/fade-out transitions using Tailwind CSS
- **Responsive**: Adapts to different screen sizes
- **Keyboard Support**: ESC key to close, tab navigation
- **Focus Management**: Traps focus within modal when open
- **Customizable**: Can control close button visibility, styling, and content

### Example Usage

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        This is the modal content
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

## Summary

- **Models**: Yes, we use `alert.model.ts` and `watchlist.model.ts` as Mongoose schemas for MongoDB
- **Modals**: Yes, we use Radix UI Dialog component (which is a modal/dialog implementation)
- Both are actively used throughout the application for data persistence and user interface interactions
