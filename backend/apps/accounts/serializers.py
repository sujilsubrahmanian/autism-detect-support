from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "full_name", "specialty"]
        read_only_fields = fields

    def get_full_name(self, obj: User) -> str:
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    # write_only: the password is accepted but never serialised back out.
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "specialty"]
        extra_kwargs = {"email": {"required": True}}

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        # Run Django's password validators with the user's other details so that
        # "too similar to username" is also caught.
        candidate = User(**{k: v for k, v in attrs.items() if k != "password"})
        validate_password(attrs["password"], user=candidate)
        return attrs

    def create(self, validated_data):
        # create_user() hashes the password; a plain objects.create() would not.
        return User.objects.create_user(**validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    """Standard JWT login, but also returns the user profile so the frontend
    does not need a second round-trip to /auth/me/."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
