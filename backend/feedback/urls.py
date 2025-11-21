from rest_framework.routers import DefaultRouter
from .views import BoardViewSet, FeedbackViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'board', BoardViewSet, basename='board')
router.register(r'feedback', FeedbackViewSet, basename='feedback')
router.register(r'comment', CommentViewSet, basename='comment')

urlpatterns = router.urls