from django.contrib import admin
from django.utils.html import format_html
 
from .models import AIProjectCache, GeneratedFile
 
 
# ---------------------------------------------------------------------------
# Custom filter for JSONField key  (Django admin can't do this natively)
# ---------------------------------------------------------------------------
 
class ComplexityFilter(admin.SimpleListFilter):
    title = "Complexity"
    parameter_name = "complexity"
 
    def lookups(self, request, model_admin):
        return [
            ("low", "Low"),
            ("medium", "Medium"),
            ("high", "High"),
        ]
 
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(classification__complexity=self.value())
        return queryset
 
 
# ---------------------------------------------------------------------------
# Inlines
# ---------------------------------------------------------------------------
 
class GeneratedFileInline(admin.TabularInline):
    model = GeneratedFile
    extra = 0
    readonly_fields = ("path", "file_type", "line_count", "created_at")
    fields = ("path", "file_type", "line_count", "created_at")
    can_delete = False
    show_change_link = True
 
    def line_count(self, obj: GeneratedFile) -> int:
        return obj.line_count
    line_count.short_description = "Lines"
 
 
@admin.register(AIProjectCache)
class AIProjectCacheAdmin(admin.ModelAdmin):
    list_display = ("id_short", "project_type", "complexity_badge", "file_count", "created_at")
    list_filter = (ComplexityFilter, "is_deleted", "created_at")
    search_fields = ("prompt", "cache_key")
    readonly_fields = ("id", "cache_key", "created_at", "updated_at", "file_count")
    inlines = [GeneratedFileInline]
 
    fieldsets = (
        ("Project", {"fields": ("id", "cache_key", "prompt")}),
        ("AI Output", {"fields": ("classification", "plan", "review")}),
        ("Meta", {"fields": ("created_at", "updated_at", "is_deleted", "file_count")}),
    )
 
    def id_short(self, obj: AIProjectCache) -> str:
        return str(obj.id)[:8]
    id_short.short_description = "ID"
 
    def project_type(self, obj: AIProjectCache) -> str:
        return obj.classification.get("project_type", "—")
    project_type.short_description = "Type"
 
    def complexity_badge(self, obj: AIProjectCache) -> str:
        colours = {"low": "green", "medium": "orange", "high": "red"}
        c = obj.complexity
        colour = colours.get(c, "grey")
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', colour, c.upper())
    complexity_badge.short_description = "Complexity"
    complexity_badge.allow_tags = True
 
 
@admin.register(GeneratedFile)
class GeneratedFileAdmin(admin.ModelAdmin):
    list_display = ("path", "file_type", "line_count", "project_link", "created_at")
    list_filter = ("file_type", "created_at")
    search_fields = ("path", "content")
    readonly_fields = ("id", "created_at", "line_count")
 
    def project_link(self, obj: GeneratedFile) -> str:
        return format_html(
            '<a href="/admin/ai_engine/aiprojectcache/{}/change/">{}</a>',
            obj.project.id,
            str(obj.project.id)[:8],
        )
    project_link.short_description = "Project"
 
    def line_count(self, obj: GeneratedFile) -> int:
        return obj.line_count
    line_count.short_description = "Lines"
 