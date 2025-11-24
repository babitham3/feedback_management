from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoardViewSet, FeedbackViewSet, CommentViewSet, InviteAcceptView, InviteRevokeView,RegisterView,BoardMembershipRequestViewSet

router = DefaultRouter()
router.register(r'board', BoardViewSet, basename='board')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'comment', CommentViewSet, basename='comment')
router.register(r'board-membership-requests', BoardMembershipRequestViewSet, basename='board-membership-requests')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('invites/<str:token>/accept/',InviteAcceptView.as_view(),name='accept-invite'),
    path('invites/<str:token>/revoke/',InviteRevokeView.as_view(),name='revoke-invite'),
]