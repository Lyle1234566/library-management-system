"""
Notification helpers for librarians and admins.
Sends in-app notifications when there are pending items that need attention.
"""
from django.contrib.auth import get_user_model
from .models import create_user_notification

User = get_user_model()


def notify_librarians_new_account(user_full_name, user_id):
    """Notify all librarians when a new account needs approval"""
    librarians = User.objects.filter(
        role__in=['LIBRARIAN', 'ADMIN'],
        is_active=True
    )
    
    for librarian in librarians:
        create_user_notification(
            user_id=librarian.id,
            notification_type='PENDING_ACCOUNT',
            title='New Account Pending Approval',
            message=f'{user_full_name} has registered and is waiting for account approval.',
            data={
                'pending_user_id': user_id,
                'pending_user_name': user_full_name,
            }
        )


def notify_librarians_new_borrow_request(user_full_name, book_title, request_id):
    """Notify all librarians when a new borrow request is submitted"""
    librarians = User.objects.filter(
        role__in=['LIBRARIAN', 'ADMIN', 'STAFF'],
        is_active=True
    )
    
    for librarian in librarians:
        create_user_notification(
            user_id=librarian.id,
            notification_type='PENDING_BORROW_REQUEST',
            title='New Borrow Request',
            message=f'{user_full_name} requested to borrow "{book_title}".',
            data={
                'borrow_request_id': request_id,
                'book_title': book_title,
            }
        )


def notify_librarians_new_renewal_request(user_full_name, book_title, request_id):
    """Notify all librarians when a new renewal request is submitted"""
    librarians = User.objects.filter(
        role__in=['LIBRARIAN', 'ADMIN', 'STAFF'],
        is_active=True
    )
    
    for librarian in librarians:
        create_user_notification(
            user_id=librarian.id,
            notification_type='PENDING_RENEWAL_REQUEST',
            title='New Renewal Request',
            message=f'{user_full_name} requested to renew "{book_title}".',
            data={
                'renewal_request_id': request_id,
                'book_title': book_title,
            }
        )


def notify_librarians_new_return_request(user_full_name, book_title, request_id):
    """Notify all librarians when a new return request is submitted"""
    librarians = User.objects.filter(
        role__in=['LIBRARIAN', 'ADMIN', 'STAFF'],
        is_active=True
    )
    
    for librarian in librarians:
        create_user_notification(
            user_id=librarian.id,
            notification_type='PENDING_RETURN_REQUEST',
            title='New Return Request',
            message=f'{user_full_name} requested to return "{book_title}".',
            data={
                'return_request_id': request_id,
                'book_title': book_title,
            }
        )
