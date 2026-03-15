import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


class SupabaseDB:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

        if not self.url:
            raise ValueError("SUPABASE_URL is missing in .env")

        if not self.key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is missing in .env")

        self.client: Client = create_client(self.url, self.key)

    def test_connection(self) -> Dict[str, Any]:
        """
        Basic connection test:
        tries to read 1 row from student_calls table.
        """
        try:
            response = self.client.table("student_calls").select("*").limit(1).execute()
            return {
                "success": True,
                "message": "Connected to Supabase and student_calls table is reachable.",
                "data": response.data
            }
        except Exception as e:
            return {
                "success": False,
                "message": "Failed to connect or access student_calls table.",
                "error": str(e)
            }

    def get_recent_calls(self, limit: int = 10) -> Dict[str, Any]:
        """
        Fetch latest rows from student_calls table.
        """
        try:
            response = (
                self.client
                .table("student_calls")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            return {
                "success": True,
                "count": len(response.data) if response.data else 0,
                "data": response.data
            }
        except Exception as e:
            return {
                "success": False,
                "message": "Could not fetch recent student_calls data.",
                "error": str(e)
            }

    def insert_test_call(
        self,
        phone_number: str = "+919999999999",
        user_message: str = "Test message from backend"
    ) -> Dict[str, Any]:
        """
        Insert a test row into student_calls to verify backend write access.
        """
        try:
            payload = {
                "phone_number": phone_number,
                "user_message": user_message,
                "sentiment": "neutral",
                "keywords": ["test", "backend", "connection"],
                "summary": "This is a backend connectivity test row.",
                "difficulty_level": "easy",
                "created_at": datetime.utcnow().isoformat()
            }

            response = self.client.table("student_calls").insert(payload).execute()

            return {
                "success": True,
                "message": "Test row inserted successfully.",
                "data": response.data
            }
        except Exception as e:
            return {
                "success": False,
                "message": "Failed to insert test row into student_calls.",
                "error": str(e)
            }

    def find_call_by_phone(self, phone_number: str) -> Dict[str, Any]:
        """
        Fetch calls by phone number.
        """
        try:
            response = (
                self.client
                .table("student_calls")
                .select("*")
                .eq("phone_number", phone_number)
                .order("created_at", desc=True)
                .execute()
            )

            return {
                "success": True,
                "count": len(response.data) if response.data else 0,
                "data": response.data
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to fetch calls for {phone_number}.",
                "error": str(e)
            }


# Run directly for testing
if __name__ == "__main__":
    db = SupabaseDB()

    print("\n--- TEST CONNECTION ---")
    print(db.test_connection())

    print("\n--- FETCH RECENT CALLS ---")
    print(db.get_recent_calls())

    print("\n--- INSERT TEST CALL ---")
    print(db.insert_test_call())

    print("\n--- FETCH AGAIN AFTER INSERT ---")
    print(db.get_recent_calls())