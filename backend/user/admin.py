from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.html import format_html_join

from books.models import BorrowRequest

from .enrollment_import import (
    ENROLLMENT_TEMPLATE_COLUMNS,
    EnrollmentImportError,
    get_enrollment_summary,
    import_enrollment_file,
)
from .forms import CustomUserChangeForm, CustomUserCreationForm, EnrollmentImportAdminForm
from .models import ContactMessage, EnrollmentRecord, Notification, User


class UserAdmin(BaseUserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    list_display = (
        'username',
        'student_id',
        'staff_id',
        'email',
        'full_name',
        'role',
        'is_working_student',
        'is_active',
        'is_staff',
        'date_joined',
    )
    list_filter = ('role', 'is_working_student', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('username', 'student_id', 'staff_id', 'email', 'full_name')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (
            'Personal Info',
            {
                'fields': (
                    'full_name',
                    'student_id',
                    'staff_id',
                    'email',
                    'email_verified',
                    'role',
                    'is_working_student',
                )
            },
        ),
        ('Borrowing Proof', {'fields': ('borrow_receipts',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': (
                    'username',
                    'student_id',
                    'staff_id',
                    'email',
                    'full_name',
                    'role',
                    'is_working_student',
                    'password1',
                    'password2',
                ),
            },
        ),
    )

    readonly_fields = ('date_joined', 'last_login', 'borrow_receipts')
    filter_horizontal = ('groups', 'user_permissions')

    def borrow_receipts(self, obj):
        requests = (
            BorrowRequest.objects.filter(
                user=obj,
                status__in=[BorrowRequest.STATUS_APPROVED, BorrowRequest.STATUS_RETURNED],
            )
            .select_related('book')
            .order_by('-processed_at', '-requested_at')[:10]
        )
        if not requests:
            return 'No approved borrows.'
        return format_html_join(
            '<br>',
            '{} - {} ({})',
            ((request.receipt_number or '-', request.book.title, request.get_status_display()) for request in requests),
        )

    borrow_receipts.short_description = 'Borrowing proof'

    class Media:
        js = ('user/admin-user-role.js',)


admin.site.register(User, UserAdmin)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'email',
        'subject',
        'status',
        'handled_by',
        'handled_at',
        'created_at',
    )
    list_filter = ('status', 'created_at', 'handled_at')
    search_fields = ('name', 'email', 'subject', 'message', 'internal_notes')
    readonly_fields = ('user', 'created_at', 'handled_at')
    ordering = ('-created_at',)


@admin.register(EnrollmentRecord)
class EnrollmentRecordAdmin(admin.ModelAdmin):
    change_list_template = 'admin/user/enrollmentrecord/change_list.html'
    list_display = (
        'student_id',
        'full_name',
        'school_email',
        'program',
        'year_level',
        'academic_term',
        'is_currently_enrolled',
        'updated_at',
    )
    list_filter = ('is_currently_enrolled', 'academic_term', 'year_level')
    search_fields = ('student_id', 'full_name', 'school_email', 'program')
    ordering = ('student_id',)
    readonly_fields = ('created_at', 'updated_at')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'import/',
                self.admin_site.admin_view(self.import_view),
                name='user_enrollmentrecord_import',
            )
        ]
        return custom_urls + urls

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        if self.has_add_permission(request):
            extra_context['enrollment_import_url'] = reverse('admin:user_enrollmentrecord_import')
        return super().changelist_view(request, extra_context=extra_context)

    def import_view(self, request):
        if not self.has_add_permission(request):
            raise PermissionDenied

        form = EnrollmentImportAdminForm(request.POST or None, request.FILES or None)
        changelist_url = reverse('admin:user_enrollmentrecord_changelist')

        if request.method == 'POST' and form.is_valid():
            try:
                result = import_enrollment_file(
                    form.cleaned_data['file'],
                    fallback_term=form.cleaned_data['academic_term'],
                )
            except EnrollmentImportError as exc:
                form.add_error('file', str(exc))
            else:
                messages.success(
                    request,
                    (
                        'Enrollment records imported successfully. '
                        f'Created: {result.created_count}, updated: {result.updated_count}, '
                        f'skipped: {result.skipped_count}.'
                    ),
                )
                for skipped_row in result.skipped_rows:
                    messages.warning(request, skipped_row)
                return redirect(changelist_url)

        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'title': 'Import enrollment records',
            'form': form,
            'summary': get_enrollment_summary(),
            'template_columns': ENROLLMENT_TEMPLATE_COLUMNS,
            'changelist_url': changelist_url,
        }
        return TemplateResponse(request, 'admin/user/enrollmentrecord/import_form.html', context)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at', 'read_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__full_name', 'user__student_id', 'user__staff_id', 'title', 'message')
    readonly_fields = ('created_at', 'read_at')
