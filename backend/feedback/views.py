from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Board, Feedback, Comment
from .serializers import BoardSerializer, FeedbackSerializer, CommentSerializer
from .permissions import (IsAdmin, IsAdminOrModerator, IsAuthorOrAdminOrModerator, is_admin_or_moderator,)

class BoardViewSet(viewsets.ModelViewSet):

    queryset = Board.objects.select_related('created_by').prefetch_related('members')
    serializer_class = BoardSerializer

    def get_queryset(self):
        user = self.request.user
        #Not logged in : public boards only
        if not user.is_authenticated:
            return Board.objects.filter(is_public=True)
        
        #Admins and Moderators: all boards
        if is_admin_or_moderator(user):
            return Board.objects.all()
        
        #Authenticated regular users: public boards + private boards where they are members
        return Board.objects.filter(Q(is_public=True) | Q(members=user)|Q(created_by=user)).distinct()
    
    def get_permissions(self):
        method = self.request.method
        #GET,HEAD,OPTIONS : any user
        if method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        
        #Only admin can create boards
        if method == 'POST':
            return [IsAdmin()]
        
        #Admin/Moderator can update any board
        if method in ("PUT","PATCH"):
            return [IsAdminOrModerator()]
        
        #Only admin can delete boards
        if method == "DELETE":
            return [IsAdmin()]
        
        #fallback
        return [permissions.IsAuthenticated()]
    
    def perform_create(self, serializer):
        board = serializer.save(created_by=self.request.user)
        board.members.add(self.request.user)  #creator is also a member


class FeedbackViewSet(viewsets.ModelViewSet):

    queryset = Feedback.objects.select_related('board','created_by').prefetch_related('upvotes')
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrAdminOrModerator]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user 

        board_id = self.request.query_params.get('board')
        if board_id:
            qs = qs.filter(board_id=board_id)

        #Not logged in: only feedbacks from public boards
        if not user.is_authenticated:
            return qs.filter(board__is_public=True)
        
        #Admins and Moderators: all feedbacks
        if is_admin_or_moderator(user):
            return qs
        
        #Normal users: feedbacks from public boards + boards where they are members or creators
        return qs.filter(Q(board__is_public=True) | Q(board__members=user)|Q(board__created_by=user)).distinct()
    
    #Creating feedback only if user is authenticated and is member/creator of the board or admin/moderator
    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated:
            raise permissions.PermissionDenied("Authentication required to create feedback.")
        
        board = serializer.validated_data['board']

        is_member = board.members.filter(id=user.id).exists()
        is_creator = (board.created_by_id == user.id)

        if not(is_admin_or_moderator(user) or is_member or is_creator):
            raise permissions.PermissionDenied("You must be a member of the board to add feedback.")
        
        serializer.save(created_by=user)

class CommentViewSet(viewsets.ModelViewSet):

    queryset = Comment.objects.select_related('feedback','created_by')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly,IsAuthorOrAdminOrModerator]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        feedback_id = self.request.query_params.get('feedback')
        if feedback_id:
            qs = qs.filter(feedback_id=feedback_id)
        
        #not logged in: only comments on feedbacks from public boards
        if not user.is_authenticated:
            return qs.filter(feedback__board__is_public=True)
        
        #Admins and Moderators: all comments
        if is_admin_or_moderator(user):
            return qs
        
        #normal users: comments on feedbacks from public boards + boards where they are members or creators
        return qs.filter(Q(feedback__board__is_public=True) | Q(feedback__board__members=user)|Q(feedback__board__created_by=user)).distinct()

    def perform_create(self, serializer):
        #runs when a new comment is created using POST request
        user = self.request.user
        if not user.is_authenticated:
            raise permissions.PermissionDenied("Authentication required to create comment.")
        
        feedback = serializer.validated_data['feedback']
        board = feedback.board

        is_member = board.members.filter(id=user.id).exists()
        is_creator = (board.created_by_id == user.id)

        if not(is_admin_or_moderator(user) or is_member or is_creator):
            raise permissions.PermissionDenied("You do not have the permission to comment on this feedback.")
        
        serializer.save(created_by=user)

