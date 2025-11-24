from django.contrib import admin
from .models import Board, Feedback, Comment, BoardInvite

@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ('id','name','is_public','created_by','created_at',)
    search_fields = ('name','description','created_by__username',)
    list_filter = ('is_public','created_at',)
    ordering = ('-created_at',)
    filter_horizontal = ('members',)

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id','title','board','created_by','status','created_at',)
    search_fields = ('title','body','created_by__username','board__name',)
    list_filter = ('status','board','created_at',)
    ordering = ('-created_at',)

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id','feedback','created_by','created_at',)
    search_fields = ('body','created_by__username','feedback__title',)
    list_filter = ('created_at',)
    ordering = ('-created_at',)

@admin.register(BoardInvite)
class BoardInviteAdmin(admin.ModelAdmin):
    list_display = ('id','board','token','created_by','created_at','expires_at','max_uses','uses','is_active',)
    search_fields = ('board__name','created_by__username','token',)
    list_filter = ('is_active','created_at','expires_at',)
    ordering = ('-created_at',)
