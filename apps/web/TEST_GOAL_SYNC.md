# Goal Sync Test Guide

## Issue Fixed

The "Invalid goal data" error was caused by:
1. **Type Mismatch**: Frontend was sending `relatedTaskIds` as numbers `[1]` but backend expected strings `["1"]`
2. **Schema Validation**: Zod schema was rejecting the mixed type data

## Fixes Applied

### Backend (`apps/backend/src/routes/goals/index.ts`)
1. **Updated Zod Schema**: 
   - Changed `relatedTaskIds: z.array(z.string())` to `z.array(z.union([z.string(), z.number()]))`
   - Added `completed: z.boolean().optional()` and `progress: z.number().optional()`

2. **Type Conversion**:
   - Added conversion of `relatedTaskIds` from numbers to strings before database operations
   - Applied to create, update, and upsert operations

### Frontend (`apps/web/lib/goalSync.ts`)
1. **Data Formatting**:
   - Convert `relatedTasks` numbers to strings before sending to backend
   - Use `.map(id => id.toString())` for all API calls

### Store (`apps/web/store/store.ts`)
1. **addGoal Function**:
   - Added proper data formatting for backend sync
   - Ensures `relatedTaskIds` are strings when sending to API

## Test Steps

1. **Start Backend Server**:
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Login to App**:
   - Use any authentication method (EVM, Starknet, etc.)
   - Ensure you have a valid JWT token

4. **Create a Goal**:
   - Go to Goals page
   - Click "Add Goal"
   - Fill in:
     - Title: "AI integration"
     - Description: "Integrate AI features"
     - Category: "Goal"
     - Link to a task (optional)
   - Click "Add Goal"

5. **Check Backend Logs**:
   - Should see: `🔐 POST /goals/create - Goal created successfully: [goal-id]`
   - No more "Invalid goal data" errors

6. **Test Sync**:
   - Click settings icon (⚙️) in goals page
   - Click "Sync to Backend"
   - Should see success message

## Expected Results

- ✅ Goal creation works without "Invalid goal data" error
- ✅ Goals sync to backend successfully
- ✅ Related task IDs are properly converted to strings
- ✅ Backend logs show successful goal creation
- ✅ Frontend shows sync success messages

## Debug Information

If issues persist, check:
1. **Browser Console**: Look for API request/response logs
2. **Backend Logs**: Check for detailed error messages
3. **Network Tab**: Verify request payload format
4. **Database**: Confirm goals are being created in the database 