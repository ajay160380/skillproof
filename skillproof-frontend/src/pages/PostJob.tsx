import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface SkillTest {
  id: number;
  title: string;
  category: {
    name: string;
  };
}

export function PostJob() {
  const [roleTitle, setRoleTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [availableTests, setAvailableTests] = useState<SkillTest[]>([]);
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'recruiter') {
      navigate('/');
      return;
    }
    api.get('/skills/tests/')
      .then(res => setAvailableTests(res.data.results || res.data))
      .catch(() => toast.error('Failed to load available tests'));
  }, [user, navigate]);

  const toggleTest = (id: number) => {
    setSelectedTests(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTests.length === 0) {
      toast.error('Please select at least one required assessment');
      return;
    }
    
    try {
      await api.post('/jobs/create/', {
        role_title: roleTitle,
        company_name: companyName,
        description,
        required_test_ids: selectedTests,
        is_active: true
      });
      toast.success('Job listing created successfully!');
      navigate('/jobs/my-listings');
    } catch (err) {
      toast.error('Failed to create job listing');
    }
  };

  return (
    <div className="flex-1 bg-vellum flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 bg-ink text-vellum p-8 md:p-12 flex flex-col justify-center relative overflow-hidden min-h-[40vh] md:min-h-0">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]" />
        
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-widest text-verification mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-verification rounded-full" />
            Recruiter Portal
          </p>
          <h1 className="font-serif text-5xl mb-6">Post a Role</h1>
          <p className="text-vellum/70 font-light leading-relaxed">
            Create a targeted job listing. Candidates will need to complete the specific AI-proctored skill tests you select to prove their fit for the role.
          </p>
        </div>
      </div>

      <div className="w-full md:w-2/3 p-8 md:p-16 flex items-center bg-white shadow-xl z-10">
        <div className="w-full max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-ink/70 mb-2">Role Title</label>
                <input
                  type="text"
                  required
                  value={roleTitle}
                  onChange={e => setRoleTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-vellum border border-structure/30 focus:outline-none focus:border-verification font-mono text-sm transition-colors"
                  placeholder="e.g. Frontend Engineer"
                />
              </div>
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest text-ink/70 mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-vellum border border-structure/30 focus:outline-none focus:border-verification font-mono text-sm transition-colors"
                  placeholder={user?.company_name || 'Company Inc.'}
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-ink/70 mb-2">Job Description</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-vellum border border-structure/30 focus:outline-none focus:border-verification font-mono text-sm transition-colors resize-none"
                placeholder="Briefly describe the responsibilities and requirements..."
              />
            </div>

            <div className="pt-4 border-t border-structure/20">
              <div className="flex justify-between items-center mb-4">
                <label className="block font-mono text-xs uppercase tracking-widest text-ink/70">
                  Required Skill Assessments
                </label>
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="px-3 py-1 bg-vellum border border-structure/30 focus:outline-none focus:border-verification font-mono text-xs transition-colors w-48"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                {availableTests
                  .filter(test => 
                    test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    test.category.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(test => {
                  const isSelected = selectedTests.includes(test.id);
                  return (
                    <button
                      type="button"
                      key={test.id}
                      onClick={() => toggleTest(test.id)}
                      className={`text-left px-4 py-3 border transition-all ${
                        isSelected 
                          ? 'bg-verification/10 border-verification shadow-sm' 
                          : 'bg-white border-structure/20 hover:border-verification/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-serif text-ink">{test.title}</span>
                        <div className={`w-4 h-4 border flex items-center justify-center ${isSelected ? 'bg-verification border-verification' : 'border-structure/30'}`}>
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-ink/50 mt-1 block">
                        {test.category.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-ink text-vellum py-4 font-mono text-sm uppercase tracking-[0.2em] hover:bg-verification transition-all active:scale-[0.98] mt-8"
            >
              Publish Job Listing
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
