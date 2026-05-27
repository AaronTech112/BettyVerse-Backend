from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    AddOn,
    Address,
    Booking,
    Order,
    OrderItem,
    OrderItemAddOn,
    Package,
    User,
)


class AddOnInline(admin.TabularInline):
    model = AddOn
    extra = 0


class OrderItemAddOnInline(admin.TabularInline):
    model = OrderItemAddOn
    extra = 0


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "BettyVerse Profile",
            {"fields": ("phone", "preferred_contact", "birthday", "event_preferences", "notes", "tier")},
        ),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "BettyVerse Profile",
            {"fields": ("email", "phone", "preferred_contact", "birthday", "event_preferences", "notes", "tier")},
        ),
    )
    list_display = (
        "username",
        "email",
        "phone",
        "preferred_contact",
        "tier",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = ("is_staff", "is_superuser", "is_active", "preferred_contact", "tier", "date_joined")
    search_fields = ("username", "email", "phone", "first_name", "last_name")
    ordering = ("-date_joined",)


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "base_price", "status", "created_at", "updated_at")
    list_filter = ("status", "category", "created_at", "updated_at")
    search_fields = ("name", "category", "tags", "summary")
    inlines = (AddOnInline,)


@admin.register(AddOn)
class AddOnAdmin(admin.ModelAdmin):
    list_display = ("name", "package", "price")
    list_filter = ("package",)
    search_fields = ("name", "package__name")


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("label", "user", "recipient", "phone", "city", "region", "country", "is_default")
    list_filter = ("is_default", "country", "region", "city")
    search_fields = ("label", "recipient", "phone", "user__username", "user__email", "city", "postcode")


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("event_type", "full_name", "user", "event_datetime", "status", "property_type", "created_at")
    list_filter = ("status", "property_type", "parking_availability", "photo_video_permission", "created_at")
    search_fields = ("event_type", "full_name", "email", "phone", "user__username", "user__email")
    date_hierarchy = "event_datetime"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_price", "booking", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("id", "user__username", "user__email", "booking__full_name")
    inlines = (OrderItemInline,)


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "package", "price", "quantity")
    list_filter = ("package",)
    search_fields = ("id", "order__id", "package__name", "order__user__username")
    inlines = (OrderItemAddOnInline,)


@admin.register(OrderItemAddOn)
class OrderItemAddOnAdmin(admin.ModelAdmin):
    list_display = ("id", "order_item", "addon", "price")
    list_filter = ("addon",)
    search_fields = ("id", "order_item__id", "addon__name", "order_item__order__id")
