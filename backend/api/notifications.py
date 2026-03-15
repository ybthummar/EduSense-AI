"""
Notifications API
─────────────────
Endpoints for student notifications (attendance alerts, etc.)

GET  /api/notifications/{student_id}         — Get notifications for a student
PUT  /api/notifications/{notification_id}/read — Mark one as read
PUT  /api/notifications/{student_id}/read-all  — Mark all as read
"""

from fastapi import APIRouter, HTTPException

from services.attendance_service import (
    get_student_notifications,
    mark_notification_read,
    mark_all_notifications_read,
)

router = APIRouter()


@router.get("/{student_id}")
def get_notifications(student_id: str):
    """Get all notifications for a student."""
    notifs = get_student_notifications(student_id)
    unread = sum(1 for n in notifs if not n["is_read"])
    return {"notifications": notifs, "unread_count": unread}


@router.put("/{notification_id}/read")
def read_notification(notification_id: int):
    """Mark a single notification as read."""
    mark_notification_read(notification_id)
    return {"success": True}


@router.put("/{student_id}/read-all")
def read_all_notifications(student_id: str):
    """Mark all notifications for a student as read."""
    count = mark_all_notifications_read(student_id)
    return {"success": True, "marked": count}
