from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions
from .models import Board, Feedback, Comment
from .serializers import BoardSerializer, FeedbackSerializer, CommentSerializer
