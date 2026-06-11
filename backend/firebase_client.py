"""Firebase Admin SDK initialisation.

NOTE: This file is deliberately named firebase_client.py, NOT firebase_admin.py.
A module named firebase_admin.py in the project root would shadow the installed
`firebase_admin` package and break every import.

Set FIREBASE_SERVICE_ACCOUNT to the path of your service account JSON
(downloaded from Firebase Console → Project settings → Service accounts).
"""
import os

import firebase_admin
from firebase_admin import credentials, firestore

_db = None


def get_db():
    """Lazily initialise the Admin SDK and return a Firestore client."""
    global _db
    if _db is not None:
        return _db

    if not firebase_admin._apps:
        sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if sa_path and os.path.exists(sa_path):
            cred = credentials.Certificate(sa_path)
            firebase_admin.initialize_app(cred)
        else:
            # Falls back to Application Default Credentials (e.g. on GCP,
            # or GOOGLE_APPLICATION_CREDENTIALS). Raises clearly if absent.
            firebase_admin.initialize_app()

    _db = firestore.client()
    return _db
