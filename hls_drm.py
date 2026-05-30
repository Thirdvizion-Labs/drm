import os
import subprocess
import secrets
import threading

class HLSDrmManager:
    def __init__(self, output_dir='static/hls', domain_url='http://localhost:7200'):
        self.output_dir = output_dir
        self.domain_url = domain_url
        os.makedirs(output_dir, exist_ok=True)

    def encrypt_video_hls(self, input_path, video_id):
        video_dir = os.path.join(self.output_dir, str(video_id))
        os.makedirs(video_dir, exist_ok=True)

        key = secrets.token_bytes(16)
        key_file_path = os.path.join(video_dir, 'video.key')
        with open(key_file_path, 'wb') as f:
            f.write(key)

        key_url = f"{self.domain_url}/api/video/{video_id}/key"
        key_info_path = os.path.join(video_dir, 'key_info.txt')
        with open(key_info_path, 'w') as f:
            f.write(f"{key_url}\n{key_file_path}")

        output_m3u8 = os.path.join(video_dir, 'playlist.m3u8')

        cmd = [
            'ffmpeg', '-i', input_path,
            '-profile:v', 'main',
            '-level', '3.0',
            '-start_number', '0',
            '-hls_time', '10',
            '-hls_list_size', '0',
            '-hls_key_info_file', key_info_path,
            '-f', 'hls',
            output_m3u8
        ]

        try:
            subprocess.run(cmd, check=True, capture_output=True)
            return output_m3u8
        except subprocess.CalledProcessError as e:
            print(f"Error encrypting: {e.stderr.decode()}")
            return None

    def encrypt_video_hls_async(self, input_path, video_id, callback=None):
        def task():
            result = self.encrypt_video_hls(input_path, video_id)
            if callback:
                callback(result)
        thread = threading.Thread(target=task, daemon=True)
        thread.start()
        return thread

hls_manager = HLSDrmManager()
