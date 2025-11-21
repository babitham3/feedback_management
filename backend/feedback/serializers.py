from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Board, Feedback, Comment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        read_only_fields = ['id', 'username', 'email']

class BoardSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True) 
    members= UserSerializer(many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id','name','description','is_public','created_by','created_at', 'members']
        read_only_fields = ['id','created_by','created_at', 'members']
    
class FeedbackSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    upvotes_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Feedback
        fields = ['id','board','title','body','created_by','created_at','updated_at','status','upvotes_count']
        read_only_fields = ['id','created_by','created_at','updated_at','upvotes_count']
    def get_upvotes_count(self, obj):
        return obj.upvotes.count()

class CommentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id','feedback','body','created_by','created_at']
        read_only_fields = ['id','feedback','created_by','created_at']