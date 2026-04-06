import logging
from datetime import datetime
from django.conf import settings
from user.email_delivery import send_email_message, get_email_config_error

logger = logging.getLogger(__name__)


def send_borrow_approved_email(user, book, borrow_request):
    """Send email when borrow request is approved"""
    if not user.email:
        logger.warning(f"User {user.id} has no email address")
        return
    
    config_error = get_email_config_error()
    if config_error:
        logger.warning(f"Email not configured: {config_error}")
        return
    
    due_date = borrow_request.due_date.strftime('%B %d, %Y') if borrow_request.due_date else 'N/A'
    receipt = borrow_request.receipt_number or 'N/A'
    
    subject = f"✅ Book Borrow Request Approved - {book.title}"
    
    text_body = f"""
Hello {user.full_name},

Great news! Your borrow request has been approved.

Book Details:
- Title: {book.title}
- Author: {book.author}
- ISBN: {book.isbn}

Borrow Information:
- Receipt Number: {receipt}
- Due Date: {due_date}
- Status: Approved

Please pick up your book from the library circulation desk.

Important Reminders:
- Return the book on or before the due date to avoid late fees
- Take good care of the book
- You can request a renewal if you need more time

Thank you for using Salazar Library!

Best regards,
Salazar Library Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .book-info {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
        .info-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #6b7280; }}
        .value {{ color: #111827; }}
        .reminder {{ background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }}
        .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
        .badge {{ display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">✅ Request Approved!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your book is ready for pickup</p>
        </div>
        <div class="content">
            <p>Hello <strong>{user.full_name}</strong>,</p>
            <p>Great news! Your borrow request has been approved.</p>
            
            <div class="book-info">
                <h3 style="margin-top: 0; color: #0ea5e9;">📚 Book Details</h3>
                <div class="info-row"><span class="label">Title:</span> <span class="value">{book.title}</span></div>
                <div class="info-row"><span class="label">Author:</span> <span class="value">{book.author}</span></div>
                <div class="info-row"><span class="label">ISBN:</span> <span class="value">{book.isbn}</span></div>
            </div>
            
            <div class="book-info">
                <h3 style="margin-top: 0; color: #8b5cf6;">📋 Borrow Information</h3>
                <div class="info-row"><span class="label">Receipt Number:</span> <span class="value">{receipt}</span></div>
                <div class="info-row"><span class="label">Due Date:</span> <span class="value">{due_date}</span></div>
                <div class="info-row"><span class="label">Status:</span> <span class="badge">Approved</span></div>
            </div>
            
            <div class="reminder">
                <h4 style="margin-top: 0;">⚠️ Important Reminders</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Return the book on or before the due date to avoid late fees</li>
                    <li>Take good care of the book</li>
                    <li>You can request a renewal if you need more time</li>
                </ul>
            </div>
            
            <p>Please pick up your book from the library circulation desk.</p>
            <p>Thank you for using Salazar Library!</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Salazar Library Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_email_message(user.email, subject, text_body, html_body)
        logger.info(f"Borrow approved email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send borrow approved email to {user.email}: {e}")


def send_borrow_rejected_email(user, book, borrow_request):
    """Send email when borrow request is rejected"""
    if not user.email:
        logger.warning(f"User {user.id} has no email address")
        return
    
    config_error = get_email_config_error()
    if config_error:
        logger.warning(f"Email not configured: {config_error}")
        return
    
    subject = f"❌ Book Borrow Request Rejected - {book.title}"
    
    text_body = f"""
Hello {user.full_name},

We regret to inform you that your borrow request has been rejected.

Book Details:
- Title: {book.title}
- Author: {book.author}
- ISBN: {book.isbn}

Your request was reviewed by our library staff and could not be approved at this time.

Possible reasons:
- The book is currently unavailable
- You have reached your borrowing limit
- There are outstanding fines on your account
- The book is reserved for reference only

If you have questions, please contact the library circulation desk.

Thank you for your understanding.

Best regards,
Salazar Library Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .book-info {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }}
        .info-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #6b7280; }}
        .value {{ color: #111827; }}
        .reasons {{ background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }}
        .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">❌ Request Rejected</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your borrow request could not be approved</p>
        </div>
        <div class="content">
            <p>Hello <strong>{user.full_name}</strong>,</p>
            <p>We regret to inform you that your borrow request has been rejected.</p>
            
            <div class="book-info">
                <h3 style="margin-top: 0; color: #ef4444;">📚 Book Details</h3>
                <div class="info-row"><span class="label">Title:</span> <span class="value">{book.title}</span></div>
                <div class="info-row"><span class="label">Author:</span> <span class="value">{book.author}</span></div>
                <div class="info-row"><span class="label">ISBN:</span> <span class="value">{book.isbn}</span></div>
            </div>
            
            <div class="reasons">
                <h4 style="margin-top: 0;">Possible Reasons</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>The book is currently unavailable</li>
                    <li>You have reached your borrowing limit</li>
                    <li>There are outstanding fines on your account</li>
                    <li>The book is reserved for reference only</li>
                </ul>
            </div>
            
            <p>If you have questions, please contact the library circulation desk.</p>
            <p>Thank you for your understanding.</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Salazar Library Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_email_message(user.email, subject, text_body, html_body)
        logger.info(f"Borrow rejected email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send borrow rejected email to {user.email}: {e}")


def send_due_date_reminder_email(user, book, borrow_request):
    """Send email reminder for upcoming due date"""
    if not user.email:
        logger.warning(f"User {user.id} has no email address")
        return
    
    config_error = get_email_config_error()
    if config_error:
        logger.warning(f"Email not configured: {config_error}")
        return
    
    due_date = borrow_request.due_date.strftime('%B %d, %Y') if borrow_request.due_date else 'N/A'
    receipt = borrow_request.receipt_number or 'N/A'
    
    subject = f"⏰ Book Due Soon - {book.title}"
    
    text_body = f"""
Hello {user.full_name},

This is a friendly reminder that your borrowed book is due soon.

Book Details:
- Title: {book.title}
- Author: {book.author}
- Receipt Number: {receipt}
- Due Date: {due_date}

Please return the book to the library on or before the due date to avoid late fees.

If you need more time, you can request a renewal through your account.

Thank you for using Salazar Library!

Best regards,
Salazar Library Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .book-info {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }}
        .info-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #6b7280; }}
        .value {{ color: #111827; }}
        .reminder {{ background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }}
        .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
        .button {{ display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">⏰ Book Due Soon!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Friendly reminder about your borrowed book</p>
        </div>
        <div class="content">
            <p>Hello <strong>{user.full_name}</strong>,</p>
            <p>This is a friendly reminder that your borrowed book is due soon.</p>
            
            <div class="book-info">
                <h3 style="margin-top: 0; color: #f59e0b;">📚 Book Details</h3>
                <div class="info-row"><span class="label">Title:</span> <span class="value">{book.title}</span></div>
                <div class="info-row"><span class="label">Author:</span> <span class="value">{book.author}</span></div>
                <div class="info-row"><span class="label">Receipt Number:</span> <span class="value">{receipt}</span></div>
                <div class="info-row"><span class="label">Due Date:</span> <span class="value" style="color: #f59e0b; font-weight: bold;">{due_date}</span></div>
            </div>
            
            <div class="reminder">
                <h4 style="margin-top: 0;">📌 Action Required</h4>
                <p style="margin: 10px 0;">Please return the book to the library on or before the due date to avoid late fees.</p>
                <p style="margin: 10px 0;">If you need more time, you can request a renewal through your account.</p>
            </div>
            
            <p>Thank you for using Salazar Library!</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Salazar Library Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_email_message(user.email, subject, text_body, html_body)
        logger.info(f"Due date reminder email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send due date reminder email to {user.email}: {e}")


def send_renewal_approved_email(user, book, borrow_request, renewal_request):
    """Send email when renewal request is approved"""
    if not user.email:
        logger.warning(f"User {user.id} has no email address")
        return
    
    config_error = get_email_config_error()
    if config_error:
        logger.warning(f"Email not configured: {config_error}")
        return
    
    new_due_date = borrow_request.due_date.strftime('%B %d, %Y') if borrow_request.due_date else 'N/A'
    receipt = borrow_request.receipt_number or 'N/A'
    
    subject = f"✅ Book Renewal Approved - {book.title}"
    
    text_body = f"""
Hello {user.full_name},

Great news! Your renewal request has been approved.

Book Details:
- Title: {book.title}
- Author: {book.author}
- Receipt Number: {receipt}

Renewal Information:
- New Due Date: {new_due_date}
- Status: Approved

You now have more time to enjoy your book!

Please remember to return the book by the new due date.

Thank you for using Salazar Library!

Best regards,
Salazar Library Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .book-info {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
        .info-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #6b7280; }}
        .value {{ color: #111827; }}
        .highlight {{ background: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
        .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
        .badge {{ display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">✅ Renewal Approved!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">You have more time with your book</p>
        </div>
        <div class="content">
            <p>Hello <strong>{user.full_name}</strong>,</p>
            <p>Great news! Your renewal request has been approved.</p>
            
            <div class="book-info">
                <h3 style="margin-top: 0; color: #10b981;">📚 Book Details</h3>
                <div class="info-row"><span class="label">Title:</span> <span class="value">{book.title}</span></div>
                <div class="info-row"><span class="label">Author:</span> <span class="value">{book.author}</span></div>
                <div class="info-row"><span class="label">Receipt Number:</span> <span class="value">{receipt}</span></div>
            </div>
            
            <div class="highlight">
                <h4 style="margin-top: 0;">🎉 Renewal Information</h4>
                <div class="info-row"><span class="label">New Due Date:</span> <span class="value" style="color: #10b981; font-weight: bold; font-size: 18px;">{new_due_date}</span></div>
                <div class="info-row"><span class="label">Status:</span> <span class="badge">Approved</span></div>
            </div>
            
            <p>You now have more time to enjoy your book!</p>
            <p>Please remember to return the book by the new due date.</p>
            <p>Thank you for using Salazar Library!</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Salazar Library Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_email_message(user.email, subject, text_body, html_body)
        logger.info(f"Renewal approved email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send renewal approved email to {user.email}: {e}")


def send_renewal_rejected_email(user, book, renewal_request):
    """Send email when renewal request is rejected"""
    if not user.email:
        logger.warning(f"User {user.id} has no email address")
        return
    
    config_error = get_email_config_error()
    if config_error:
        logger.warning(f"Email not configured: {config_error}")
        return
    
    subject = f"❌ Book Renewal Rejected - {book.title}"
    
    text_body = f"""
Hello {user.full_name},

We regret to inform you that your renewal request has been rejected.

Book Details:
- Title: {book.title}
- Author: {book.author}

Your renewal request was reviewed and could not be approved at this time.

Possible reasons:
- You have reached the maximum number of renewals for this book
- The book has been reserved by another user
- There are outstanding fines on your account
- The book is overdue

Please return the book by the original due date to avoid additional late fees.

If you have questions, please contact the library circulation desk.

Thank you for your understanding.

Best regards,
Salazar Library Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .book-info {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }}
        .info-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #6b7280; }}
        .value {{ color: #111827; }}
        .reasons {{ background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }}
        .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">❌ Renewal Rejected</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your renewal request could not be approved</p>
        </div>
        <div class="content">
            <p>Hello <strong>{user.full_name}</strong>,</p>
            <p>We regret to inform you that your renewal request has been rejected.</p>
            
            <div class="book-info">
                <h3 style="margin-top: 0; color: #ef4444;">📚 Book Details</h3>
                <div class="info-row"><span class="label">Title:</span> <span class="value">{book.title}</span></div>
                <div class="info-row"><span class="label">Author:</span> <span class="value">{book.author}</span></div>
            </div>
            
            <div class="reasons">
                <h4 style="margin-top: 0;">Possible Reasons</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>You have reached the maximum number of renewals for this book</li>
                    <li>The book has been reserved by another user</li>
                    <li>There are outstanding fines on your account</li>
                    <li>The book is overdue</li>
                </ul>
            </div>
            
            <p>Please return the book by the original due date to avoid additional late fees.</p>
            <p>If you have questions, please contact the library circulation desk.</p>
            <p>Thank you for your understanding.</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Salazar Library Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_email_message(user.email, subject, text_body, html_body)
        logger.info(f"Renewal rejected email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send renewal rejected email to {user.email}: {e}")


def send_return_approved_email(user, book, return_request):
    """Send email when return is approved"""
    if not user.email:
        logger.warning(f"User {user.id} has no email address")
        return
    
    config_error = get_email_config_error()
    if config_error:
        logger.warning(f"Email not configured: {config_error}")
        return
    
    subject = f"✅ Book Return Confirmed - {book.title}"
    
    text_body = f"""
Hello {user.full_name},

Your book return has been confirmed!

Book Details:
- Title: {book.title}
- Author: {book.author}

Thank you for returning the book on time and taking good care of it.

You can now borrow more books from our library.

Thank you for using Salazar Library!

Best regards,
Salazar Library Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .book-info {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
        .info-row {{ margin: 10px 0; }}
        .label {{ font-weight: bold; color: #6b7280; }}
        .value {{ color: #111827; }}
        .footer {{ text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin: 0;">✅ Return Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for returning your book</p>
        </div>
        <div class="content">
            <p>Hello <strong>{user.full_name}</strong>,</p>
            <p>Your book return has been confirmed!</p>
            
            <div class="book-info">
                <h3 style="margin-top: 0; color: #10b981;">📚 Book Details</h3>
                <div class="info-row"><span class="label">Title:</span> <span class="value">{book.title}</span></div>
                <div class="info-row"><span class="label">Author:</span> <span class="value">{book.author}</span></div>
            </div>
            
            <p>Thank you for returning the book on time and taking good care of it.</p>
            <p>You can now borrow more books from our library.</p>
            <p>Thank you for using Salazar Library!</p>
            
            <div class="footer">
                <p>Best regards,<br><strong>Salazar Library Team</strong></p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_email_message(user.email, subject, text_body, html_body)
        logger.info(f"Return approved email sent to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send return approved email to {user.email}: {e}")
