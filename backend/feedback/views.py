from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, permissions,generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Board, Feedback, Comment, BoardMembershipRequest
from .serializers import BoardSerializer, FeedbackSerializer, CommentSerializer, FeedbackStatusSerializer, RegisterSerializer, BoardMembershipRequestSerializer
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
        if getattr(self, 'action', None) == 'request_membership':
            return [permissions.IsAuthenticated()]
        
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

    @action(detail=True,methods=['post'],url_path='request_membership',permission_classes=[permissions.IsAuthenticated])    
    def request_membership(self,request,pk=None):
        user = request.user
        board = self.get_object()

        #Membership requests to public boards 
        if not board.is_public:
            return Response({"detail":"Membership requests are only for public boards."},status=403,)
        #Check if user is already a member
        if board.members.filter(id=user.id).exists():
            return Response({"detail":"You are already a member of this board."},status=400,)
        #Check if there is already a pending request
        existing = BoardMembershipRequest.objects.filter(board=board,user=user,status=BoardMembershipRequest.STATUS_PENDING,).first()
        if existing:
            return Response({"detail":"You already have a pending membership request for this board."},status=400,)
        
        #Creating a new pending request if it doesnt exist yet
        message = request.data.get('message','')
        membership_request = BoardMembershipRequest.objects.create(board=board,user=user,message=message,status=BoardMembershipRequest.STATUS_PENDING)
        serializer = BoardMembershipRequestSerializer(membership_request,context={'request':request})



class FeedbackViewSet(viewsets.ModelViewSet):

    queryset = Feedback.objects.select_related('board','created_by').prefetch_related('upvotes')
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrAdminOrModerator]

    def get_permissions(self):
        if self.action == 'set_status':
            return [permissions.IsAuthenticated(), IsAdminOrModerator()]
        
        if self.action == 'upvote_feedback':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticatedOrReadOnly(), IsAuthorOrAdminOrModerator()]

    def get_serializer_class(self):
        if self.action == 'set_status':
            return FeedbackStatusSerializer
        return FeedbackSerializer
    
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
            raise PermissionDenied("Authentication required to create feedback.")
        
        board = serializer.validated_data['board']

        is_member = board.members.filter(id=user.id).exists()
        is_creator = (board.created_by_id == user.id)

        if not(is_admin_or_moderator(user) or is_member or is_creator):
            raise PermissionDenied("You must be a member of the board to add feedback.")
        
        serializer.save(created_by=user)
    
    #Toggling upvote for the current user.
    @action(detail=True,methods=['post'],url_path='upvote')
    def upvote_feedback(self,request,pk=None):
        user = request.user
        if not user.is_authenticated:
            return Response({"detail":"Authentication required to upvote."},status=403,)
        
        feedback = self.get_object()
        board = feedback.board

        #Board access check
        is_member = board.members.filter(id=user.id).exists()
        is_creator = (board.created_by_id == user.id)

        if not(is_admin_or_moderator(user) or is_member or is_creator):
            return Response({"detail":"You do not have permission to upvote this feedback."},status=403,)
        
        #Toggling upvote
        if feedback.upvotes.filter(id=user.id).exists():
            feedback.upvotes.remove(user)
            upvoted = False
        else:
            feedback.upvotes.add(user)
            upvoted = True

        feedback.refresh_from_db()

        return Response({'id':feedback.id,'upvoted':upvoted,'upvotes_count':feedback.upvotes.count(),})
    
    #Admin/Moderator can change status of feedback
    @action(detail=True,methods=['post'],url_path='set_status')
    def set_status(self,request,pk=None):
        user = request.user
        if not is_admin_or_moderator(user):
            return Response({"detail":"Only Admin or Moderator can change feedback status."},status=403,)
        
        feedback = self.get_object()

        status_serializer = self.get_serializer(data=request.data)
        status_serializer.is_valid(raise_exception=True)
        new_status = status_serializer.validated_data['status']
        
        feedback.status = new_status
        feedback.save(update_fields=['status'])

        output_serializer = FeedbackSerializer(feedback,context={'request':request})
        return Response(output_serializer.data)



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
            raise PermissionDenied("Authentication required to create comment.")
        
        feedback = serializer.validated_data['feedback']
        board = feedback.board

        is_member = board.members.filter(id=user.id).exists()
        is_creator = (board.created_by_id == user.id)

        if not(is_admin_or_moderator(user) or is_member or is_creator):
            raise PermissionDenied("You do not have the permission to comment on this feedback.")
        
        serializer.save(created_by=user)

#Public end point for user sign up
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes=[permissions.AllowAny]


class BoardMembershipRequestViewSet(viewsets.ModelViewSet):
    queryset = BoardMembershipRequest.objects.select_related("board", "user", "handled_by")
    serializer_class = BoardMembershipRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrModerator]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        membership_request = self.get_object()
        user = request.user

        if membership_request.status != BoardMembershipRequest.STATUS_PENDING:
            return Response(
                {"detail": "Only pending requests can be approved."},
                status=400,
            )

        # Approve
        membership_request.status = BoardMembershipRequest.STATUS_APPROVED
        membership_request.handled_by = user
        membership_request.handled_at = timezone.now()
        membership_request.save()

        # Add user to board members
        board = membership_request.board
        board.members.add(membership_request.user)

        serializer = self.get_serializer(membership_request)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        membership_request = self.get_object()
        user = request.user

        if membership_request.status != BoardMembershipRequest.STATUS_PENDING:
            return Response(
                {"detail": "Only pending requests can be rejected."},
                status=400,
            )

        membership_request.status = BoardMembershipRequest.STATUS_REJECTED
        membership_request.handled_by = user
        membership_request.handled_at = timezone.now()
        membership_request.save()

        serializer = self.get_serializer(membership_request)
        return Response(serializer.data)