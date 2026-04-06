# Email Notification System

## Overview
The library management system now sends automatic email notifications to students and teachers for all major events.

## Implemented Email Notifications

### ✅ Borrow Request Approved
- **Trigger**: When staff/librarian approves a borrow request
- **Recipient**: Student/Teacher who requested the book
- **Content**: Book details, receipt number, due date, pickup instructions

### ✅ Borrow Request Rejected
- **Trigger**: When staff/librarian rejects a borrow request
- **Recipient**: Student/Teacher who requested the book
- **Content**: Book details, possible reasons for rejection, contact information

### ✅ Due Date Reminder
- **Trigger**: Automated reminder before book is due (configured in automation)
- **Recipient**: Student/Teacher with borrowed book
- **Content**: Book details, due date, renewal option

### ✅ Renewal Request Approved
- **Trigger**: When staff/librarian approves a renewal request
- **Recipient**: Student/Teacher who requested renewal
- **Content**: Book details, new due date, confirmation

### ✅ Renewal Request Rejected
- **Trigger**: When staff/librarian rejects a renewal request
- **Recipient**: Student/Teacher who requested renewal
- **Content**: Book details, possible reasons, original due date reminder

### ✅ Return Confirmed
- **Trigger**: When staff/librarian approves a return request
- **Recipient**: Student/Teacher who returned the book
- **Content**: Book details, thank you message, confirmation

## Email Templates

All emails include:
- Professional HTML design with gradients and modern styling
- Clear book information
- Action-specific details (due dates, receipt numbers, etc.)
- Library branding
- Plain text fallback for email clients that don't support HTML

## Configuration

Emails are sent using the existing email configuration in `backend/.env`:

```env
# Email Provider (auto, smtp, resend, or bridge)
EMAIL_PROVIDER=auto

# SMTP Configuration (if using SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=library@yourdomain.com

# Resend Configuration (if using Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=library@yourdomain.com

# Email Bridge Configuration (if using bridge)
EMAIL_BRIDGE_URL=https://your-bridge-url.com/send
EMAIL_BRIDGE_SECRET=your-bridge-secret
```

## Files Modified

1. **backend/books/email_notifications.py** (NEW)
   - Contains all email template functions
   - Handles email sending with error logging
   - Professional HTML and text templates

2. **backend/books/views.py** (MODIFIED)
   - Added email notification calls to approve/reject actions
   - Borrow request approve/reject
   - Renewal request approve/reject
   - Return request approve

## Error Handling

- Email failures are logged but don't block the main operation
- If email configuration is missing, a warning is logged
- Users without email addresses are skipped with a warning log

## Testing

To test the email notifications:

1. Ensure email configuration is set in `backend/.env`
2. Create a borrow request as a student
3. Approve/reject it as staff
4. Check the student's email inbox

## Future Enhancements

Additional email notifications that can be added:
- Overdue book reminders
- Fine payment confirmations
- Reservation availability notifications
- Account suspension/reactivation notices
- Bulk announcements from librarian

## Deployment

After pushing these changes:

```bash
git add backend/books/email_notifications.py backend/books/views.py
git commit -m "Add email notifications for borrow/return/renewal events"
git push
```

The email system will automatically work on your deployed Render instance using the existing email configuration.
