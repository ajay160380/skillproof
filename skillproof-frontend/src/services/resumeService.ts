import { api } from './api';

export interface Resume {
  id: number;
  file: string;
  extracted_skills: string[] | null;
  uploaded_at: string;
  parsing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SuggestedTest {
  id: number;
  title: string;
  category: string;
  category_slug: string;
  difficulty: string;
  duration_minutes: number;
  test_type: 'communication' | 'coding' | 'screen_task';
}

export const uploadResume = async (file: File): Promise<Resume> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/resumes/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getMyResume = async (): Promise<Resume> => {
  const response = await api.get('/resumes/my-resume/');
  return response.data;
};

export const getSuggestedTests = async (): Promise<SuggestedTest[]> => {
  const response = await api.get('/resumes/suggested-tests/');
  return response.data;
};

export const deleteResume = async (): Promise<void> => {
  await api.delete('/resumes/my-resume/');
};
