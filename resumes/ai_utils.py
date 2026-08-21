import json
import re
from groq import Groq
from django.conf import settings

def extract_text_from_file(file_path: str) -> str:
    ext = file_path.lower().split('.')[-1]
    if ext == 'pdf':
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return ""
    elif ext == 'docx':
        try:
            from docx import Document
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            print(f"Error reading DOCX: {e}")
            return ""
    return ""

def extract_skills_via_keywords(text: str) -> list:
    # Fallback keyword list
    common_skills = [
        "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "React", "Angular", "Vue",
        "Node.js", "Django", "Flask", "Spring", "SQL", "MySQL", "PostgreSQL", "MongoDB", "AWS",
        "Azure", "GCP", "Docker", "Kubernetes", "Machine Learning", "Data Science", "UI/UX Design",
        "Communication", "Team Leadership", "Project Management", "Agile", "Scrum", "Git",
        "Linux", "Cybersecurity", "Blockchain", "DevOps", "HTML", "CSS", "Tailwind"
    ]
    extracted = []
    text_lower = text.lower()
    for skill in common_skills:
        # Use regex to match whole words where possible or just simple substring
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            extracted.append(skill)
    return extracted[:12]

def extract_skills_via_ai(text: str) -> list:
    if not settings.GROQ_API_KEY:
        return extract_skills_via_keywords(text)
        
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        prompt = f"""
        Extract a comprehensive list of the most important HARD technical skills (e.g., programming languages, frameworks, core technical tools, databases, cloud platforms) mentioned in this resume text.
        Do NOT include generic soft skills. Extract up to 15 distinct technical skills.
        Return ONLY a JSON array of skill strings, nothing else. Example: ["Python", "React", "AWS"]

        Resume text: {text[:5000]}
        """
        
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            max_tokens=300,
        )
        
        response_text = completion.choices[0].message.content.strip()
        
        # Robust extraction: find the first '[' and last ']'
        start = response_text.find('[')
        end = response_text.rfind(']')
        if start != -1 and end != -1 and end > start:
            json_str = response_text[start:end+1]
            skills_list = json.loads(json_str)
            if isinstance(skills_list, list) and len(skills_list) > 0:
                return skills_list[:15]
                
        return extract_skills_via_keywords(text)
    except Exception as e:
        print(f"AI extraction failed: {e}")
        return extract_skills_via_keywords(text)
