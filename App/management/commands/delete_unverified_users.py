from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Delete unverified users older than 24 hours'

    def handle(self, *args, **kwargs):
        cutoff = timezone.now() - timedelta(hours=24)
        deleted_count, _ = User.objects.filter(is_active=False, date_joined__lt=cutoff).delete()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} unverified users"))