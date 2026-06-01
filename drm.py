import os
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64

class DRMManager:
    def __init__(self, master_key=None):
        if master_key:
            self.master_key = self._derive_key(master_key)
        else:
            self.master_key = Fernet.generate_key()
        self.fernet = Fernet(self.master_key)
    
    def _derive_key(self, password):
        salt = b'strivehigh_salt_2024'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key
    
    def get_key(self):
        return self.master_key.decode()
    
    def encrypt_file(self, input_path, output_path):
        with open(input_path, 'rb') as f:
            data = f.read()
        
        encrypted = self.fernet.encrypt(data)
        
        with open(output_path, 'wb') as f:
            f.write(encrypted)
        
        return output_path
    
    def decrypt_file(self, input_path):
        with open(input_path, 'rb') as f:
            encrypted_data = f.read()
        
        decrypted = self.fernet.decrypt(encrypted_data)
        return decrypted
    
    def encrypt_data(self, data):
        if isinstance(data, str):
            data = data.encode()
        return self.fernet.encrypt(data)
    
    def decrypt_data(self, encrypted_data):
        return self.fernet.decrypt(encrypted_data)
    
    def generate_video_token(self, lesson_id, user_id):
        import time
        payload = f"{lesson_id}:{user_id}:{int(time.time())}"
        return self.fernet.encrypt(payload.encode()).decode()
    
    def validate_video_token(self, token):
        try:
            decrypted = self.fernet.decrypt(token.encode())
            parts = decrypted.decode().split(':')
            if len(parts) == 3:
                return {
                    'lesson_id': int(parts[0]),
                    'user_id': int(parts[1]),
                    'timestamp': int(parts[2])
                }
            return None
        except:
            return None

def encrypt_video_for_storage(input_path, output_path, key):
    fernet = Fernet(key)
    with open(input_path, 'rb') as f:
        data = f.read()
    encrypted = fernet.encrypt(data)
    with open(output_path, 'wb') as f:
        f.write(encrypted)

def decrypt_video_chunk(encrypted_path, offset, length, key):
    fernet = Fernet(key)
    with open(encrypted_path, 'rb') as f:
        f.seek(offset)
        encrypted_chunk = f.read(length)
    return fernet.decrypt(encrypted_chunk)

drm_manager = DRMManager()