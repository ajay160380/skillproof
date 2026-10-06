import re
import cloudinary
import cloudinary.utils
from django.conf import settings

def get_resume_download_url(file_url_or_obj):
    if not file_url_or_obj:
        return ""
    
    url = str(file_url_or_obj)
    if hasattr(file_url_or_obj, 'url'):
        try:
            url = file_url_or_obj.url
        except Exception:
            url = str(file_url_or_obj)
        
    if not url:
        return ""
        
    if 'cloudinary.com' in url:
        c_storage = getattr(settings, 'CLOUDINARY_STORAGE', {})
        if c_storage:
            cloudinary.config(
                cloud_name=c_storage.get('CLOUD_NAME'),
                api_key=c_storage.get('API_KEY'),
                api_secret=c_storage.get('API_SECRET'),
                secure=True
            )
        
        # Raw files: e.g. /raw/upload/v1/media/resumes/resume.pdf
        raw_match = re.search(r'/raw/upload/(?:v\d+/)?(.*)$', url)
        if raw_match:
            public_id = raw_match.group(1)
            try:
                return cloudinary.utils.private_download_url(public_id, '', resource_type='raw', type='upload')
            except Exception as e:
                print(f"Error generating private raw download URL: {e}")
                
        # Image files: e.g. /image/upload/v1234/media/resumes/resume.pdf
        img_match = re.search(r'/image/upload/(?:v\d+/)?(.*?)(?:\.pdf)?$', url)
        if img_match:
            public_id = img_match.group(1)
            try:
                return cloudinary.utils.private_download_url(public_id, 'pdf', resource_type='image', type='upload')
            except Exception as e:
                print(f"Error generating private image download URL: {e}")
                
    return url
