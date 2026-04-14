from __future__ import annotations

from django.db import models
  
import uuid
 
from django.db import models
from django.utils import timezone
 
 
class AIProjectCache(models.Model):
    """
    One row per unique generated project.
    Files are stored in the related GeneratedFile model.
    """
 
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
 
    # Lookup key — SHA-256 of normalised prompt
    cache_key = models.CharField(max_length=64, unique=True, db_index=True)
 
    # Raw prompt kept for display / debugging
    prompt = models.TextField()
 
    # Structured outputs from classification and planning steps
    classification = models.JSONField(default=dict)
    plan = models.JSONField(default=dict)
 
    # Markdown review report from the audit step
    review = models.TextField(blank=True, default="")
 
    # Lifecycle
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
 
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "AI Project Cache"
        verbose_name_plural = "AI Project Caches"
 
    def __str__(self) -> str:
        return f"{self.classification.get('project_type', 'project')} [{self.cache_key[:8]}]"
 
    @property
    def file_count(self) -> int:
        return self.files.count()
 
    @property
    def complexity(self) -> str:
        return self.classification.get("complexity", "unknown")
 
 
class GeneratedFile(models.Model):
    """
    A single generated file belonging to a project.
    Stored separately so the frontend can request individual files.
    """
 
    FILE_TYPE_CHOICES = [
        ("backend", "Backend"),
        ("frontend", "Frontend"),
        ("config", "Config"),
        ("test", "Test"),
    ]
 
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        AIProjectCache,
        on_delete=models.CASCADE,
        related_name="files",
    )
 
    # e.g. "backend/core/models.py"
    path = models.CharField(max_length=500)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default="backend")
    content = models.TextField()
 
    created_at = models.DateTimeField(default=timezone.now)
 
    class Meta:
        ordering = ["path"]
        unique_together = [("project", "path")]
        verbose_name = "Generated File"
        verbose_name_plural = "Generated Files"
 
    def __str__(self) -> str:
        return f"{self.project} → {self.path}"
 
    @property
    def line_count(self) -> int:
        return self.content.count("\n") + 1
 
    @property
    def extension(self) -> str:
        return self.path.rsplit(".", 1)[-1] if "." in self.path else ""
