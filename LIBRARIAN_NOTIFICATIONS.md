# Librarian Notification System

## Overview

Librarians and admins now receive in-app notifications when there are pending items that need their attention.

## Notification Types

### 1. **Pending Account Approval** (`PENDING_ACCOUNT`)
- **Triggered when**: A new user completes email verification and their account is created
- **Recipients**: All active LIBRARIAN and ADMIN users
- **Message**: "{User Name} has registered and is waiting for account approval."
- **Action**: Librarians can go to Pending Accounts to approve/reject

### 2. **New Borrow Request** (`PENDING_BORROW_REQUEST`)
- **Triggered when**: A student/teacher submits a borrow request
- **Recipients**: All active LIBRARIAN, ADMIN, and STAFF users
- **Message**: "{User Name} requested to borrow "{Book Title}"."
- **Action**: Staff can approve/reject the request

### 3. **New Renewal Request** (`PENDING_RENEWAL_REQUEST`)
- **Triggered when**: A user requests to renew a borrowed book
- **Recipients**: All active LIBRARIAN, ADMIN, and STAFF users
- **Message**: "{User Name} requested to renew "{Book Title}"."
- **Action**: Staff can approve/reject the renewal

### 4. **New Return Request** (`PENDING_RETURN_REQUEST`)
- **Triggered when**: A user requests to return a borrowed book
- **Recipients**: All active LIBRARIAN, ADMIN, and STAFF users
- **Message**: "{User Name} requested to return "{Book Title}"."
- **Action**: Staff can approve/reject the return

## Implementation Files

### Backend Files Created/Modified:

1. **`backend/books/librarian_notifications.py`** (NEW)
   - Helper functions to notify all librarians
   - `notify_librarians_new_account()`
   - `notify_librarians_new_borrow_request()`
   - `notify_librarians_new_renewal_request()`
   - `notify_librarians_new_return_request()`

2. **`backend/user/views.py`** (MODIFIED)
   - Added notification when new account is created in `finalize_pending_registration()`

3. **`backend/books/views.py`** (MODIFIED)
   - Added notification when borrow request is created
   - Added notification when renewal request is created
   - Added notification when return request is created

## How It Works

1. **User Action**: Student/teacher performs an action (register, borrow, renew, return)
2. **Request Created**: System creates the pending request in the database
3. **Notification Sent**: System automatically notifies all relevant librarians/staff
4. **Librarian Sees**: Notification appears in their notification bell with unread count
5. **Librarian Acts**: Clicks notification to go to the relevant page and approve/reject

## Benefits

✅ **Real-time alerts** - Librarians know immediately when action is needed
✅ **No missed requests** - All librarians/staff are notified
✅ **Faster processing** - Reduces wait time for students
✅ **Better workflow** - Clear indication of pending work
✅ **Improved service** - Students get faster responses

## Testing

### Test Pending Account Notification:
1. Register a new student account
2. Verify email with OTP
3. Login as librarian
4. Check notifications - should see "New Account Pending Approval"

### Test Borrow Request Notification:
1. Login as student
2. Request to borrow a book
3. Login as librarian/staff
4. Check notifications - should see "New Borrow Request"

### Test Renewal Request Notification:
1. Login as student with an active borrow
2. Request renewal
3. Login as librarian/staff
4. Check notifications - should see "New Renewal Request"

### Test Return Request Notification:
1. Login as student with an active borrow
2. Request to return the book
3. Login as librarian/staff
4. Check notifications - should see "New Return Request"

## Error Handling

All notification calls are wrapped in try-except blocks to ensure:
- Notifications failures don't block the main operation
- Errors are logged for debugging
- System continues to function even if notifications fail

## Future Enhancements

Potential improvements:
- Email notifications in addition to in-app notifications
- Configurable notification preferences per librarian
- Notification grouping (e.g., "5 new borrow requests")
- Push notifications for mobile app
- Notification sound/desktop alerts

---

**Last Updated**: December 2024
**Status**: ✅ Implemented and Ready for Testing
