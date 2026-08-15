from celery import shared_task
from .models import Resume
from .ai_utils import extract_text_from_file, extract_skills_via_ai

@shared_task
def process_resume_skills(resume_id: int):
    try:
        resume = Resume.objects.get(id=resume_id)
        resume.parsing_status = 'processing'
        resume.save(update_fields=['parsing_status'])
        
        # Extract text from file
        text = extract_text_from_file(resume.file.path)
        resume.extracted_text = text
        resume.save(update_fields=['extracted_text'])
        
        # Extract skills using Groq / fallback
        skills = extract_skills_via_ai(text)
        resume.extracted_skills = skills
        resume.parsing_status = 'completed'
        
        resume.save(update_fields=['extracted_skills', 'parsing_status'])
        
    except Exception as e:
        if 'resume' in locals():
            resume.parsing_status = 'failed'
            resume.save(update_fields=['parsing_status'])
        print(f"Failed to process resume {resume_id}: {e}")
