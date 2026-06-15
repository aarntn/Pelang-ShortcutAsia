"""Firebase Admin SDK initialisation.

NOTE: This file is deliberately named firebase_client.py, NOT firebase_admin.py.
A module named firebase_admin.py in the project root would shadow the installed
`firebase_admin` package and break every import.

Credential resolution order:
  1. FIREBASE_SERVICE_ACCOUNT_JSON env var — raw JSON string (Railway / cloud).
  2. FIREBASE_SERVICE_ACCOUNT env var — path to a JSON file.
  3. service-account.json next to this file (local dev default).
  4. Application Default Credentials (GCP / GOOGLE_APPLICATION_CREDENTIALS).
"""
import base64
import json
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
        sa_b64 = os.environ.get("FIREBASE_SA_B64")
        if sa_b64:
            # Cloud deployments: service account JSON base64-encoded as env var.
            # Base64 sidesteps every newline/BOM/encoding edge case.
            cred = credentials.Certificate(json.loads(base64.b64decode(sa_b64.lstrip("﻿"))))
            firebase_admin.initialize_app(cred)
        else:
            default_sa_path = os.path.join(os.path.dirname(__file__), "service-account.json")
            sa_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT") or default_sa_path
            if sa_path and os.path.exists(sa_path):
                cred = credentials.Certificate(sa_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()

    _db = firestore.client()
    return _db
