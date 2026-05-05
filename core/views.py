import json
from decimal import Decimal, InvalidOperation
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect
from django.utils.text import slugify
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import CreateView, TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth import login, update_session_auth_hash
from django.contrib.auth.views import LoginView
from django.contrib import messages
from .forms import BookingRequestForm, CustomUserCreationForm
from .models import AddOn, Address, Booking, Order, OrderItem, OrderItemAddOn, Package


def _resolve_package_image_url(package):
    if package.image:
        return package.image.url
    if package.image_url:
        if package.image_url.startswith("http://") or package.image_url.startswith("https://") or package.image_url.startswith("/"):
            return package.image_url
        return "/static/" + package.image_url.lstrip("/")
    return ""


def _get_or_create_cart_order(user):
    order = (
        Order.objects.filter(user=user, status="pending", booking__isnull=True)
        .order_by("-created_at")
        .first()
    )
    if order:
        return order
    return Order.objects.create(user=user, total_price=Decimal("0.00"), status="pending")


def _serialize_cart_order(order):
    items = []
    total = Decimal("0.00")
    order_items = order.items.select_related("package").prefetch_related("selected_addons__addon")

    for item in order_items:
        package = item.package
        if not package:
            continue

        addon_rows = []
        addon_total = Decimal("0.00")
        for selected_addon in item.selected_addons.all():
            addon_total += selected_addon.price
            addon_rows.append(
                {
                    "id": selected_addon.addon_id,
                    "name": selected_addon.addon.name if selected_addon.addon else "Add-on",
                    "price": float(selected_addon.price),
                }
            )

        base_price = item.price or Decimal("0.00")
        line_total = (base_price + addon_total) * item.quantity
        total += line_total

        items.append(
            {
                "id": item.id,
                "package_id": package.id,
                "name": package.name,
                "category": package.category,
                "summary": package.summary,
                "image": _resolve_package_image_url(package),
                "quantity": item.quantity,
                "basePrice": float(base_price),
                "addonTotal": float(addon_total),
                "price": float(base_price + addon_total),
                "addons": addon_rows,
            }
        )

    if order.total_price != total:
        order.total_price = total
        order.save(update_fields=["total_price"])

    return {"items": items, "items_count": len(items), "total": float(total)}


def _build_cart_summary_text(order):
    cart = _serialize_cart_order(order)
    if not cart["items"]:
        return ""

    lines = ["Selected packages from cart:"]
    for item in cart["items"]:
        addon_text = ""
        if item["addons"]:
            addon_text = " | Add-ons: " + ", ".join(
                f'{addon["name"]} (+£{addon["price"]:.2f})' for addon in item["addons"]
            )
        lines.append(f'- {item["name"]} (£{item["price"]:.2f}){addon_text}')
    return "\n".join(lines)


def _read_json_payload(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return {}


def _to_decimal(value, fallback="0.00"):
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(fallback)


def _serialize_address(address):
    return {
        "id": address.id,
        "label": address.label,
        "recipient": address.recipient,
        "phone": address.phone,
        "line1": address.line1,
        "line2": address.line2 or "",
        "city": address.city,
        "region": address.region,
        "postcode": address.postcode,
        "country": address.country,
        "isDefault": bool(address.is_default),
    }


def _serialize_dashboard_profile(user):
    return {
        "id": f"user-{user.pk}",
        "name": user.get_full_name().strip() or user.username,
        "email": user.email or "",
        "phone": user.phone or "",
        "preferredContact": user.preferred_contact or "email",
        "birthday": user.birthday.isoformat() if user.birthday else "",
        "eventPreferences": user.event_preferences or "",
        "notes": user.notes or "",
        "loyaltyTier": user.tier or "Standard",
        "memberSince": user.date_joined.date().isoformat() if user.date_joined else "",
        "avatar": "/static/images/logo.png",
    }


def _serialize_dashboard_orders(user):
    orders = (
        Order.objects.filter(user=user)
        .prefetch_related("items__package", "items__selected_addons__addon")
        .order_by("-created_at")[:20]
    )
    rows = []
    for order in orders:
        item_count = order.items.count()
        first_item = order.items.first()
        summary = first_item.package.name if first_item and first_item.package else "Package order"
        rows.append(
            {
                "id": f"ORD-{order.id}",
                "date": order.created_at.date().isoformat(),
                "total": float(order.total_price),
                "status": order.get_status_display(),
                "items": item_count,
                "summary": summary,
            }
        )
    return rows


def _serialize_dashboard_bookings(user):
    bookings = Booking.objects.filter(user=user).order_by("-created_at")[:20]
    rows = []
    for booking in bookings:
        related_order = (
            Order.objects.filter(user=user, booking=booking)
            .prefetch_related("items__package")
            .first()
        )
        package_name = "Custom Package"
        if related_order and related_order.items.first() and related_order.items.first().package:
            package_name = related_order.items.first().package.name
        rows.append(
            {
                "id": f"BK-{booking.id}",
                "eventType": booking.event_type,
                "eventDate": booking.event_datetime.date().isoformat(),
                "createdAt": booking.created_at.date().isoformat(),
                "venue": booking.property_type.title(),
                "packageName": package_name,
                "guestCount": 0,
                "status": booking.get_status_display(),
                "notes": booking.special_requests or "No additional booking notes.",
            }
        )
    return rows

class HomeView(TemplateView):
    template_name = 'index.html'


class AboutView(TemplateView):
    template_name = 'about.html'


class ServicesView(TemplateView):
    template_name = 'services.html'


class PackagesView(TemplateView):
    template_name = 'packages.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        selected_filter = (self.request.GET.get("filter") or "all").strip().lower()

        packages_qs = Package.objects.filter(status="published").prefetch_related("addons").order_by("-created_at")
        if selected_filter and selected_filter != "all":
            packages_qs = packages_qs.filter(
                Q(category__icontains=selected_filter)
                | Q(tags__icontains=selected_filter)
                | Q(name__icontains=selected_filter)
            )

        bootstrap_rows = []
        for package in packages_qs:
            bootstrap_rows.append(
                {
                    "id": package.id,
                    "slug": package.name.lower().replace(" ", "-"),
                    "name": package.name,
                    "category": package.category,
                    "tags": package.tags or "",
                    "summary": package.summary,
                    "image": _resolve_package_image_url(package),
                    "base_price": float(package.base_price),
                    "addons": [
                        {"id": addon.id, "name": addon.name, "price": float(addon.price)}
                        for addon in package.addons.all()
                    ],
                }
            )

        context["packages_bootstrap"] = bootstrap_rows
        context["active_filter"] = selected_filter
        return context


class BookingView(LoginRequiredMixin, TemplateView):
    template_name = 'booking.html'
    login_url = reverse_lazy("login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        order = _get_or_create_cart_order(self.request.user)
        cart_summary = _build_cart_summary_text(order)
        initial = {
            "full_name": self.request.user.get_full_name().strip() or self.request.user.username,
            "phone": self.request.user.phone or "",
            "email": self.request.user.email or "",
            "preferred_contact": self.request.user.preferred_contact if hasattr(self.request.user, "preferred_contact") else "",
        }
        if self.request.GET.get("cart") == "1" and cart_summary:
            initial["special_requests"] = cart_summary
        context["form"] = kwargs.get("form") or BookingRequestForm(initial=initial)
        return context

    def post(self, request, *args, **kwargs):
        form = BookingRequestForm(request.POST)
        if not form.is_valid():
            messages.error(request, "Please correct the booking form fields and submit again.")
            return self.render_to_response(self.get_context_data(form=form))

        with transaction.atomic():
            booking = form.save(commit=False)
            booking.user = request.user
            booking.save()

            cart_order = _get_or_create_cart_order(request.user)
            cart_items = list(cart_order.items.prefetch_related("selected_addons__addon").select_related("package"))

            if cart_items:
                default_address = (
                    Address.objects.filter(user=request.user, is_default=True).first()
                    or Address.objects.filter(user=request.user).first()
                )
                order_total = Decimal("0.00")
                final_order = Order.objects.create(
                    user=request.user,
                    booking=booking,
                    address=default_address,
                    total_price=Decimal("0.00"),
                    status="pending",
                )
                for cart_item in cart_items:
                    final_item = OrderItem.objects.create(
                        order=final_order,
                        package=cart_item.package,
                        price=cart_item.price,
                        quantity=cart_item.quantity,
                    )
                    for selected in cart_item.selected_addons.all():
                        OrderItemAddOn.objects.create(
                            order_item=final_item,
                            addon=selected.addon,
                            price=selected.price,
                        )
                    addon_total = sum((selected.price for selected in cart_item.selected_addons.all()), Decimal("0.00"))
                    order_total += (cart_item.price + addon_total) * cart_item.quantity

                final_order.total_price = order_total
                final_order.save(update_fields=["total_price"])

            # Always remove the active cart order after successful booking submission.
            cart_order.delete()

        messages.success(request, "Booking submitted successfully. We will contact you shortly.")
        return redirect("dashboard")


class CartView(LoginRequiredMixin, TemplateView):
    template_name = 'cart.html'
    login_url = reverse_lazy("login")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        order = _get_or_create_cart_order(self.request.user)
        context["cart_bootstrap"] = _serialize_cart_order(order)
        return context


class BlogView(TemplateView):
    template_name = 'blog.html'

class SignUpView(CreateView):
    form_class = CustomUserCreationForm
    success_url = reverse_lazy('dashboard')
    template_name = 'login/signup.html'
    
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('dashboard')
        return super().dispatch(request, *args, **kwargs)

    def form_valid(self, form):
        response = super().form_valid(form)
        login(self.request, self.object)
        messages.success(self.request, "Welcome to BettyVerse. Your account is ready.")
        return response

    def form_invalid(self, form):
        messages.error(self.request, "Please correct the highlighted errors and try again.")
        return super().form_invalid(form)

class CustomLoginView(LoginView):
    template_name = 'login/login_index.html'
    redirect_authenticated_user = True

    def form_invalid(self, form):
        messages.error(self.request, "Invalid username or password.")
        return super().form_invalid(form)


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'user-dashboard.html'
    login_url = reverse_lazy('login')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["dashboard_bootstrap"] = _serialize_dashboard_profile(self.request.user)
        return context


class AdminPanelView(LoginRequiredMixin, TemplateView):
    template_name = 'admin-panel/index.html'
    login_url = reverse_lazy('login')


class CartDataView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def get(self, request, *args, **kwargs):
        order = _get_or_create_cart_order(request.user)
        return JsonResponse({"ok": True, "cart": _serialize_cart_order(order)})


class CartAddItemView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        package_id = payload.get("package_id")
        package_slug = str(payload.get("package_slug") or "").strip()
        package_name = str(payload.get("package_name") or "").strip()
        package_category = str(payload.get("package_category") or "").strip()
        package_price = _to_decimal(payload.get("package_price"), "0.00")
        package_summary = str(payload.get("package_summary") or "").strip()
        package_image = str(payload.get("package_image") or "").strip()
        package_tags = str(payload.get("package_tags") or "").strip()
        addon_ids = payload.get("addon_ids") or []
        addon_names = payload.get("addon_names") or []
        addon_rows = payload.get("addon_rows") or []

        package = None
        published_qs = Package.objects.filter(status="published")

        if package_id:
            package = published_qs.filter(pk=package_id).first()

        if not package and package_name:
            by_name = published_qs.filter(name__iexact=package_name)
            if package_category:
                by_name = by_name.filter(category__iexact=package_category)
            package = by_name.order_by("-updated_at").first()

        if not package and package_slug:
            normalized_target = slugify(package_slug)
            for candidate in published_qs.only("id", "name"):
                if slugify(candidate.name) == normalized_target:
                    package = candidate
                    break

        if not package:
            if not package_name:
                return JsonResponse({"ok": False, "error": "Package not found."}, status=404)
            package, _ = Package.objects.get_or_create(
                name=package_name,
                category=package_category or "Package",
                defaults={
                    "base_price": package_price,
                    "summary": package_summary or package_name,
                    "image_url": package_image,
                    "status": "published",
                    "tags": package_tags,
                },
            )

        selected_addons = []
        if addon_ids:
            selected_addons.extend(AddOn.objects.filter(package=package, id__in=addon_ids))
        if addon_names:
            normalized_names = [str(name).strip() for name in addon_names if str(name).strip()]
            if normalized_names:
                name_q = Q()
                for name in normalized_names:
                    name_q |= Q(name__iexact=name)
                selected_addons.extend(AddOn.objects.filter(package=package).filter(name_q))
        if addon_rows:
            for row in addon_rows:
                name = str((row or {}).get("name") or "").strip()
                if not name:
                    continue
                price = _to_decimal((row or {}).get("price"), "0.00")
                addon = AddOn.objects.filter(package=package, name__iexact=name).first()
                if not addon:
                    addon = AddOn.objects.create(package=package, name=name, price=price)
                selected_addons.append(addon)
        # Remove duplicates while preserving queryset instances.
        selected_addons = list({addon.id: addon for addon in selected_addons}.values())

        order = _get_or_create_cart_order(request.user)
        item = order.items.filter(package=package).first()
        if not item:
            item = OrderItem.objects.create(
                order=order,
                package=package,
                price=package.base_price,
                quantity=1,
            )
        else:
            item.price = package.base_price
            item.quantity = 1
            item.save(update_fields=["price", "quantity"])

        item.selected_addons.all().delete()
        for addon in selected_addons:
            OrderItemAddOn.objects.create(order_item=item, addon=addon, price=addon.price)

        return JsonResponse({"ok": True, "cart": _serialize_cart_order(order)})


class CartRemoveItemView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        item_id = payload.get("item_id")
        if not item_id:
            return JsonResponse({"ok": False, "error": "item_id is required."}, status=400)

        order = _get_or_create_cart_order(request.user)
        order.items.filter(id=item_id).delete()
        return JsonResponse({"ok": True, "cart": _serialize_cart_order(order)})


class CartClearView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        order = _get_or_create_cart_order(request.user)
        order.items.all().delete()
        return JsonResponse({"ok": True, "cart": _serialize_cart_order(order)})


class DashboardDataView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def get(self, request, *args, **kwargs):
        user = request.user
        addresses = Address.objects.filter(user=user).order_by("-is_default", "-id")
        return JsonResponse(
            {
                "ok": True,
                "profile": _serialize_dashboard_profile(user),
                "orders": _serialize_dashboard_orders(user),
                "bookings": _serialize_dashboard_bookings(user),
                "addresses": [_serialize_address(address) for address in addresses],
            }
        )


class DashboardProfileUpdateView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        user = request.user

        name = str(payload.get("name") or "").strip()
        if name:
            parts = name.split()
            user.first_name = parts[0]
            user.last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
        user.email = str(payload.get("email") or user.email or "").strip().lower()
        user.phone = str(payload.get("phone") or "").strip()
        user.preferred_contact = str(payload.get("preferredContact") or "email").strip() or "email"
        user.event_preferences = str(payload.get("eventPreferences") or "").strip()
        user.notes = str(payload.get("notes") or "").strip()

        birthday_value = str(payload.get("birthday") or "").strip()
        if birthday_value:
            user.birthday = birthday_value
        else:
            user.birthday = None

        user.save()
        profile = _serialize_dashboard_profile(user)
        if payload.get("avatar"):
            profile["avatar"] = payload.get("avatar")
        return JsonResponse({"ok": True, "profile": profile})


class DashboardAddressSaveView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        user = request.user
        address_id = payload.get("id")

        if address_id:
            address = get_object_or_404(Address, id=address_id, user=user)
        else:
            address = Address(user=user)

        address.label = str(payload.get("label") or "").strip() or "Home"
        address.recipient = str(payload.get("recipient") or user.get_full_name() or user.username).strip()
        address.phone = str(payload.get("phone") or user.phone or "").strip()
        address.line1 = str(payload.get("line1") or "").strip()
        address.line2 = str(payload.get("line2") or "").strip()
        address.city = str(payload.get("city") or "").strip()
        address.region = str(payload.get("region") or "").strip()
        address.postcode = str(payload.get("postcode") or "").strip()
        address.country = str(payload.get("country") or "").strip()
        address.is_default = bool(payload.get("isDefault"))

        required_fields = [address.line1, address.city, address.region, address.postcode, address.country]
        if not all(required_fields):
            return JsonResponse({"ok": False, "error": "Please complete all required address fields."}, status=400)

        with transaction.atomic():
            if address.is_default:
                Address.objects.filter(user=user, is_default=True).update(is_default=False)
            address.save()

        return JsonResponse({"ok": True, "address": _serialize_address(address)})


class DashboardPasswordChangeView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        current_password = str(payload.get("currentPassword") or "")
        new_password = str(payload.get("newPassword") or "")

        if not request.user.check_password(current_password):
            return JsonResponse({"ok": False, "error": "Current password is incorrect."}, status=400)
        if len(new_password) < 8:
            return JsonResponse({"ok": False, "error": "New password must be at least 8 characters."}, status=400)

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])
        update_session_auth_hash(request, request.user)
        return JsonResponse({"ok": True})


class CheckoutAddressView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def get(self, request, *args, **kwargs):
        address = (
            Address.objects.filter(user=request.user, is_default=True).first()
            or Address.objects.filter(user=request.user).first()
        )
        if not address:
            return JsonResponse(
                {
                    "ok": True,
                    "address": {
                        "label": "Home",
                        "line1": "",
                        "line2": "",
                        "city": "",
                        "postcode": "",
                        "country": "",
                    },
                }
            )
        return JsonResponse(
            {
                "ok": True,
                "address": {
                    "label": address.label,
                    "line1": address.line1,
                    "line2": address.line2 or "",
                    "city": address.city,
                    "postcode": address.postcode,
                    "country": address.country,
                },
            }
        )

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        label = str(payload.get("label") or "Home").strip() or "Home"
        line1 = str(payload.get("line1") or "").strip()
        city = str(payload.get("city") or "").strip()
        postcode = str(payload.get("postcode") or "").strip()
        country = str(payload.get("country") or "").strip()
        line2 = str(payload.get("line2") or "").strip()

        if not line1 or not city or not postcode or not country:
            return JsonResponse({"ok": False, "error": "Please complete all required address fields."}, status=400)

        with transaction.atomic():
            Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
            address = Address.objects.create(
                user=request.user,
                label=label,
                recipient=request.user.get_full_name().strip() or request.user.username,
                phone=request.user.phone or "",
                line1=line1,
                line2=line2,
                city=city,
                region=city,
                postcode=postcode,
                country=country,
                is_default=True,
            )
        return JsonResponse(
            {
                "ok": True,
                "address": {
                    "label": address.label,
                    "line1": address.line1,
                    "line2": address.line2 or "",
                    "city": address.city,
                    "postcode": address.postcode,
                    "country": address.country,
                },
            }
        )


class CheckoutPayView(LoginRequiredMixin, View):
    login_url = reverse_lazy("login")

    def post(self, request, *args, **kwargs):
        payload = _read_json_payload(request)
        method = str(payload.get("method") or "card").strip().lower()
        if method not in {"card", "paypal", "apple", "google"}:
            return JsonResponse({"ok": False, "error": "Invalid payment method."}, status=400)

        order = _get_or_create_cart_order(request.user)
        if not order.items.exists():
            return JsonResponse({"ok": False, "error": "Your cart is empty."}, status=400)

        address = (
            Address.objects.filter(user=request.user, is_default=True).first()
            or Address.objects.filter(user=request.user).first()
        )
        order.address = address
        order.status = "paid"
        order.save(update_fields=["address", "status"])

        return JsonResponse(
            {
                "ok": True,
                "order_id": order.id,
                "message": f"{method.title()} payment confirmed successfully.",
            }
        )
