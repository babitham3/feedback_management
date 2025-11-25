from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BoardViewSet, FeedbackViewSet, CommentViewSet, InviteAcceptView, InviteRevokeView,RegisterView,BoardMembershipRequestViewSet
from .analytics_views import analytics_summary,analytics_top_voted,analytics_distribution,analytics_trends

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
    path('analytics/summary/', analytics_summary, name='analytics-summary'),
    path('analytics/top_voted/', analytics_top_voted, name='analytics-top'),
    path('analytics/trends/', analytics_trends, name='analytics-trends'),
    path('analytics/distribution/', analytics_distribution, name='analytics-distribution'),
]