from django.conf import settings
from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.GenericAPIView):
    """Create a doctor account (can be switched off in production)."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    @extend_schema(responses={201: UserSerializer})
    def post(self, request):
        if not settings.ALLOW_DOCTOR_SELF_REGISTRATION:
            return Response(
                {"detail": "Self-registration is disabled. Ask an administrator for an account."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Return the public profile only - never echo request data back.
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """Exchange username + password for an access/refresh JWT pair."""

    serializer_class = LoginSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"  # brute-force protection


class MeView(generics.RetrieveAPIView):
    """Profile of the currently authenticated doctor."""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
