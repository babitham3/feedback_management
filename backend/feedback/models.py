from django.db import models
from django.contrib.auth.models import User

class Board(models.Model):
    """"" Container. Can be public  or private. Users can be members of multiple boards. """""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)

    created_by = models.ForeignKey(User,on_delete=models.CASCADE, related_name='boards_created')
    created_at = models.DateTimeField(auto_now_add=True)

    members = models.ManyToManyField(User, related_name='boards', blank=True)

    def __str__(self):
        return self.name

class Feedback(models.Model):
    """"" Feedback item associated with a single board.It has upvotes from users."""""
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='feedbacks')
    title = models.CharField(max_length=255)
    body = models.TextField()

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    STATUS_OPEN = 'open'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'
    STATUS_CHOICES = [(STATUS_OPEN, 'Open'), (STATUS_IN_PROGRESS, 'In Progress'), (STATUS_COMPLETED, 'Completed')]

    status = models.CharField(max_length=30,choices=STATUS_CHOICES, default=STATUS_OPEN)
    upvotes = models.ManyToManyField(User, related_name='upvoted_feedbacks', blank=True)

    def __str__(self):
        return f"{self.title} ({self.board.name})"
    

class Comment(models.Model):
    """"" Comment on a feedback item. Users can comment on feedbacks."""""
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name='comments')
    body = models.TextField()

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments_created')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.created_by.username} on feedback{self.feedback.title}'