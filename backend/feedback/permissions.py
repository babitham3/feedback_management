from rest_framework.permissions import BasePermission, SAFE_METHODS

def user_in_group(user,group_name):
    return user.is_authenticated and user.groups.filter(name=group_name).exists()

def is_admin(user):
    return user_in_group(user,'Admin')

def is_moderator(user):
    return user_in_group(user,'Moderator')

def is_admin_or_moderator(user):
    return is_admin(user) or is_moderator(user)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)

class IsAdminOrModerator(BasePermission):
    def has_permission(self, request, view):
        return is_admin_or_moderator(request.user)
    
class IsAuthorOrAdminOrModerator(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        
        user = request.user
        if not user.is_authenticated:
            return False
        if is_admin_or_moderator(user):
            return True
        
        return getattr(obj,'created_by',None) == user.id