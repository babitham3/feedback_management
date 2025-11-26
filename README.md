# Feedback Management System

A full-stack application for collecting, organizing, and managing customer feedback.  
Backend: **Django REST Framework + JWT**  
Frontend: **React (Vite) + TailwindCSS**

---

## Features

### User Roles
- **Admin** – create/delete boards, manage invites, approve members, edit all content  
- **Moderator** – update boards, manage feedback & comments, change status  
- **Contributor** – create feedback/comments only on boards they are members of  
- **Anonymous** – can only read public boards

### Boards
- Public or Private  
- Only members can interact  
- Membership requests (public boards)  
- Invite links (admin/mod only)

### Feedback
- Belongs to a board  
- Title, body, timestamps  
- Upvotes (toggle)  
- Status workflow: `open → in_progress → completed`  
- Admin/Moderator can change status

### Comments
- Linked to feedback  
- Authors can edit/delete their own  
- Admin/Moderator can manage all

---

## Backend Setup (Django)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
## API Root:
➡ http://127.0.0.1:8000/feedback-api/v1/

## Create User Roles
python manage.py shell -c "from django.contrib.auth.models import Group; [Group.objects.get_or_create(name=n) for n in ['Admin','Moderator','Contributor']]"

Assign users to groups via ```bash /admin/ ``` or Django shell

## Frontend Setup (Recact+Vite)
```bash
cd frontend
npm install
npm run dev
```
This runs at
http://localhost:5173

## Backend testing
```bash 
python manage.py test
```

## Future possible implementations
- A better and aesthetic UI 
- Upvotes on comments
- Reply threads
- Frontend testing
- Backend functional testing
- Dark mode and light mode toggle