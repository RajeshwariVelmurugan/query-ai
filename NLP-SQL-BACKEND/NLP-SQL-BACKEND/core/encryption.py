from cryptography.fernet import Fernet
import base64
import hashlib
from config import settings
import logging

logger = logging.getLogger(__name__)

# Convert any key to a valid Fernet key (32 bytes)
def get_fernet_key(key: str) -> bytes:
    """Convert any string to a valid Fernet key"""
    # Hash the key to get consistent 32 bytes
    key_hash = hashlib.sha256(key.encode()).digest()
    # Fernet needs base64-encoded 32-byte key
    return base64.urlsafe_b64encode(key_hash)

# Create cipher with our key
cipher = Fernet(get_fernet_key(settings.ENCRYPTION_KEY))

def encrypt_data(data: str) -> str:
    """
    Encrypt sensitive data (passwords, credentials)
    """
    if not data:
        return data
    return cipher.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt encrypted data
    """
    if not encrypted_data:
        return encrypted_data
    return cipher.decrypt(encrypted_data.encode()).decode()