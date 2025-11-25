# backend/feedback/analytics_views.py
from datetime import datetime, timedelta
from django.db.models import Count
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from django.utils.dateparse import parse_date

from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response

from .models import Feedback, Board
from .permissions import is_admin_or_moderator

# helper: parse date range strings into date objects (YYYY-MM-DD)
def parse_date_range(from_s, to_s, default_days=30):
    if from_s:
        start = parse_date(from_s)
    else:
        start = (datetime.utcnow() - timedelta(days=default_days)).date()
    if to_s:
        end = parse_date(to_s)
    else:
        end = datetime.utcnow().date()
    # if parsing failed, fallback
    if start is None:
        start = (datetime.utcnow() - timedelta(days=default_days)).date()
    if end is None:
        end = datetime.utcnow().date()
    return start, end

def require_admin_mod(request):
    return request.user and request.user.is_authenticated and is_admin_or_moderator(request.user)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def analytics_summary(request):
    """Return counts: total, open, in_progress, completed"""
    if not require_admin_mod(request):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    board_id = request.query_params.get("board")
    from_s = request.query_params.get("from")
    to_s = request.query_params.get("to")
    start, end = parse_date_range(from_s, to_s, default_days=90)

    qs = Feedback.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
    if board_id:
        qs = qs.filter(board_id=board_id)

    total = qs.count()
    by_status = qs.values("status").annotate(count=Count("id"))
    status_map = {r["status"]: r["count"] for r in by_status}

    return Response({
        "total": total,
        "open": status_map.get("open", 0),
        "in_progress": status_map.get("in_progress", 0),
        "completed": status_map.get("completed", 0),
    })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def analytics_top_voted(request):
    """Return top N feedback by upvotes in range"""
    if not require_admin_mod(request):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    board_id = request.query_params.get("board")
    limit = int(request.query_params.get("limit", 5))
    from_s = request.query_params.get("from")
    to_s = request.query_params.get("to")
    start, end = parse_date_range(from_s, to_s, default_days=365)

    qs = Feedback.objects.annotate(upvotes_count=Count("upvotes"))\
         .filter(created_at__date__gte=start, created_at__date__lte=end)
    if board_id:
        qs = qs.filter(board_id=board_id)

    top = qs.order_by("-upvotes_count", "-created_at")[:limit]
    result = []
    for f in top:
        result.append({
            "id": f.id,
            "title": f.title,
            "board_id": f.board_id,
            "board_name": getattr(f.board, "name", None),
            "upvotes": getattr(f, "upvotes_count", 0),
            "status": f.status,
            "created_at": f.created_at,
        })
    return Response(result)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def analytics_trends(request):
    """
    Return time series of created feedback counts.
    Query params:
      - granularity: daily | weekly | monthly
      - board: optional board id
      - from, to: YYYY-MM-DD
    """
    if not require_admin_mod(request):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    gran = request.query_params.get("granularity", "daily")
    board_id = request.query_params.get("board")
    from_s = request.query_params.get("from")
    to_s = request.query_params.get("to")
    start, end = parse_date_range(from_s, to_s, default_days=30)

    qs = Feedback.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
    if board_id:
        qs = qs.filter(board_id=board_id)

    if gran == "weekly":
        series = qs.annotate(period=TruncWeek("created_at")).values("period").annotate(count=Count("id")).order_by("period")
    elif gran == "monthly":
        series = qs.annotate(period=TruncMonth("created_at")).values("period").annotate(count=Count("id")).order_by("period")
    else:
        series = qs.annotate(period=TruncDay("created_at")).values("period").annotate(count=Count("id")).order_by("period")

    data = []
    for row in series:
        period = row["period"]
        # ensure JSON-serializable: convert datetime/date to ISO string
        if hasattr(period, "date"):
            period_val = period.date().isoformat()
        else:
            try:
                period_val = period.isoformat()
            except Exception:
                period_val = str(period)
        data.append({"period": period_val, "count": row["count"]})
    return Response(data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def analytics_distribution(request):
    """
    Distribution counts grouped by 'status' (default), 'board' or 'tag'.
    Params:
      - by: status | board | tag
      - board, from, to optional
    """
    if not require_admin_mod(request):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    by = request.query_params.get("by", "status")
    board_id = request.query_params.get("board")
    from_s = request.query_params.get("from")
    to_s = request.query_params.get("to")
    start, end = parse_date_range(from_s, to_s, default_days=365)

    qs = Feedback.objects.filter(created_at__date__gte=start, created_at__date__lte=end)
    if board_id:
        qs = qs.filter(board_id=board_id)

    if by == "board":
        agg = qs.values("board_id", "board__name").annotate(count=Count("id")).order_by("-count")
        data = [{"key": (r["board__name"] or r["board_id"]), "count": r["count"]} for r in agg]
    elif by == "tag":
        # If you don't have tags M2M, replace this block with appropriate field.
        agg = qs.values("tags__name").annotate(count=Count("id")).order_by("-count")
        data = [{"key": (r["tags__name"] or "Unknown"), "count": r["count"]} for r in agg]
    else:
        agg = qs.values("status").annotate(count=Count("id")).order_by("-count")
        data = [{"key": r["status"], "count": r["count"]} for r in agg]

    return Response(data)