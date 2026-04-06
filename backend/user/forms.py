from pathlib import Path

from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from .models import User


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('username', 'student_id', 'staff_id', 'email', 'full_name', 'role', 'is_working_student')


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = '__all__'


class EnrollmentImportAdminForm(forms.Form):
    file = forms.FileField(
        label='Enrollment file',
        help_text='Upload a CSV or Excel (.xlsx) file with enrollment records.',
    )
    academic_term = forms.CharField(
        required=False,
        label='Fallback academic term',
        help_text='Used when the uploaded file does not include an academic_term column.',
    )

    def clean_file(self):
        uploaded_file = self.cleaned_data['file']
        suffix = Path(uploaded_file.name or '').suffix.lower()
        if suffix not in {'.csv', '.xlsx'}:
            raise forms.ValidationError('Upload a CSV or Excel (.xlsx) file.')
        return uploaded_file


class TeacherImportAdminForm(forms.Form):
    file = forms.FileField(
        label='Teacher records file',
        help_text='Upload a CSV or Excel (.xlsx) file with teacher records. PDF is not supported for bulk import.',
    )

    def clean_file(self):
        uploaded_file = self.cleaned_data['file']
        suffix = Path(uploaded_file.name or '').suffix.lower()
        if suffix not in {'.csv', '.xlsx'}:
            raise forms.ValidationError('Upload a CSV or Excel (.xlsx) file.')
        return uploaded_file
