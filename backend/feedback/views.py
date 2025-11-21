from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions
from .models import Board, Feedback, Comment
from .serializers import BoardSerializer, FeedbackSerializer, CommentSerializer

class BoardViewSet(viewsets.ModelViewSet):

    queryset = Board.objects.all().select_related('created_by').prefetch_related('members')
    serializer_class = BoardSerializer

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class FeedbackViewSet(viewsets.ModelViewSet):

    queryset = Feedback.objects.select_related('board','created_by').prefetch_related('upvotes')
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        board_id = self.request.query_params.get('board_id')
        if board_id:
            qs = qs.filter(board_id=board_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):

    queryset = Comment.objects.select_related('feedback','created_by')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        feedback_id = self.request.query_params.get('feedback_id')
        if feedback_id:
            qs = qs.filter(feedback_id=feedback_id)
        return qs

    def perform_create(self, serializer):
        #runs when a new comment is created using POST request
        serializer.save(created_by=self.request.user)


