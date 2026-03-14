"""Firebase/Firestore database helpers for the backend."""

import os
from typing import Any, Dict, Optional

import firebase_admin
from firebase_admin import credentials, firestore

from config import FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID

_db: Optional[firestore.Client] = None


def _build_service_account() -> Optional[Dict[str, Any]]:
    """Build service-account payload from environment variables if available."""
    if not (FIREBASE_PROJECT_ID and FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY):
        return None

    return {
        "type": "service_account",
        "project_id": FIREBASE_PROJECT_ID,
        "private_key": FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
        "client_email": FIREBASE_CLIENT_EMAIL,
        "token_uri": "https://oauth2.googleapis.com/token",
    }


def init_firestore() -> firestore.Client:
    """Initialise Firebase Admin and return a Firestore client."""
    global _db

    if _db is not None:
        return _db

    if not firebase_admin._apps:
        service_account = _build_service_account()
        credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()

        if service_account:
            cred = credentials.Certificate(service_account)
            firebase_admin.initialize_app(cred, {"projectId": FIREBASE_PROJECT_ID})
        elif credentials_path:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
        else:
            # Allows running in environments where ADC is configured (e.g. GCP).
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db


def get_firestore() -> firestore.Client:
    """Return Firestore client, initialising lazily."""
    return init_firestore()


def next_sequence(counter_name: str) -> int:
    """Generate an auto-increment integer counter in Firestore."""
    db = get_firestore()
    counter_ref = db.collection("_counters").document(counter_name)
    transaction = db.transaction()

    @firestore.transactional
    def _increment(txn: firestore.Transaction) -> int:
        snapshot = counter_ref.get(transaction=txn)
        current = 0
        if snapshot.exists:
            current = int(snapshot.to_dict().get("value", 0))
        nxt = current + 1
        txn.set(counter_ref, {"value": nxt}, merge=True)
        return nxt

    return _increment(transaction)
