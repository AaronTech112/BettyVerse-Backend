from django import forms
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.forms import UserCreationForm
from .models import Booking, User


class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    phone = forms.CharField(required=False, max_length=20)

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("username", "email", "phone", "password1", "password2")

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("An account with this email already exists.")
        return email

    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        user.phone = self.cleaned_data.get("phone", "")
        if commit:
            user.save()
        return user


class EmailAuthenticationForm(AuthenticationForm):
    username = forms.EmailField(
        label="Email",
        widget=forms.EmailInput(
            attrs={
                "autofocus": True,
                "placeholder": "Email address",
                "autocomplete": "email",
            }
        ),
    )


class BookingRequestForm(forms.ModelForm):
    event_datetime = forms.DateTimeField(
        input_formats=(
            "%Y-%m-%dT%H:%M",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y-%m-%d %H:%M:%S",
        )
    )
    photo_video_permission = forms.ChoiceField(
        choices=(("yes", "Yes"), ("no", "No")),
        required=True,
    )
    travel_fees_ack = forms.BooleanField(required=True)
    deposit_required_ack = forms.BooleanField(required=True)

    class Meta:
        model = Booking
        fields = (
            "full_name",
            "phone",
            "email",
            "event_type",
            "event_datetime",
            "theme",
            "occasion_details",
            "special_requests",
            "property_type",
            "parking_availability",
            "access_instructions",
            "budget",
            "photo_video_permission",
            "inspiration_links",
        )
        widgets = {
            "event_datetime": forms.DateTimeInput(attrs={"type": "datetime-local"}),
        }

    def clean_photo_video_permission(self):
        value = self.cleaned_data.get("photo_video_permission")
        return value == "yes"
