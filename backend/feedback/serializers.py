from rest_framework import serializers
from django.contrib.auth.models import User,Group
from .models import Board, BoardInvite, Feedback, Comment, BoardMembershipRequest

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    def get_groups(self, obj):
        return [g.name for g in obj.groups.all()]
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'groups', 'is_staff', 'is_superuser']
        read_only_fields = ['id', 'username', 'email', 'groups', 'is_staff', 'is_superuser']

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
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Feedback
        fields = ['id','board','title','body','created_by','created_at','updated_at','status','upvotes_count']
        read_only_fields = ['id','created_by','created_at','updated_at','upvotes_count','status']
    def get_upvotes_count(self, obj):
        return obj.upvotes.count()
    
    def update(self, instance, validated_data):
        # Prevent status from being updated via this serializer
        validated_data.pop('status', None)
        return super().update(instance, validated_data)
    
class FeedbackStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Feedback.STATUS_CHOICES)

class CommentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id','feedback','body','created_by','created_at']
        read_only_fields = ['id','created_by','created_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True,min_length=8)

    class Meta:
        model = User
        fields = ['id','username','email','password']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(username=validated_data['username'], email=validated_data.get('email',''),password=password,)

        contributor_group, _ = Group.objects.get_or_create(name='Contributor')
        contributor_group.user_set.add(user)

        return user
    
class BoardMembershipRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    board = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all())

    class Meta:
        model = BoardMembershipRequest
        fields = ['id','board','user','status','message','requested_at','handled_at','handled_by']
        read_only_fields = ['id','user','status','requested_at','handled_at','handled_by']
    
class BoardInviteSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    board = serializers.PrimaryKeyRelatedField(queryset=Board.objects.all())

    class Meta:
        model = BoardInvite 
        fields = ['id','board','token','created_by','created_at','expires_at','max_uses','uses','is_active','note']
        read_only_fields = ['id','token','created_by','created_at','uses']