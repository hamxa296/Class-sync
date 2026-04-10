import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageSquare, HelpCircle } from 'lucide-react';
import { DATA } from '../data/faculties';

export default function Home() {
  const navigate = useNavigate();
  
  const [facultyIdx, setFacultyIdx] = useState(0);
  const [programIdx, setProgramIdx] = useState(0);
  const [semesterIdx, setSemesterIdx] = useState(0);

  const faculties = DATA.faculties;
  const currentFaculty = faculties[facultyIdx];
  const programs = currentFaculty?.programs || [];
  const currentProgram = programs[programIdx];
  const semesters = currentProgram?.semesters || [];

  // Reset indices when parent selection changes
  useEffect(() => {
    setProgramIdx(0);
    setSemesterIdx(0);
  }, [facultyIdx]);

  useEffect(() => {
    setSemesterIdx(0);
  }, [programIdx]);

  const handleStart = (e) => {
    e.preventDefault();
    navigate(`/calculator/${facultyIdx}/${programIdx}/${semesterIdx}`);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto' }}>
      <div className="card">
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>GIKI GPA Calculator</h1>
        
        <form onSubmit={handleStart}>
          <div className="form-group">
            <label className="form-label">Select Faculty</label>
            <select 
              className="form-select"
              value={facultyIdx}
              onChange={(e) => setFacultyIdx(parseInt(e.target.value))}
            >
              {faculties.map((f, i) => (
                <option key={i} value={i}>{f.faculty_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Program</label>
            <select 
              className="form-select"
              value={programIdx}
              onChange={(e) => setProgramIdx(parseInt(e.target.value))}
            >
              {programs.map((p, i) => (
                <option key={i} value={i}>{p.program_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Semester</label>
            <select 
              className="form-select"
              value={semesterIdx}
              onChange={(e) => setSemesterIdx(parseInt(e.target.value))}
            >
              {semesters.map((s, i) => (
                <option key={i} value={i}>Semester {s.semester}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}
          >
            Start Calculating <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <button 
            type="button"
            onClick={() => window.open('mailto:support@example.com?subject=GIKI GPA Calculator Issue')}
            className="btn-ghost" 
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', border: 'none', background: 'transparent' }}
          >
            <MessageSquare size={16} /> Report Issue
          </button>
          
          <button 
            type="button"
            onClick={() => alert("If your specific Program or Faculty isn't listed here yet, please use the 'Report Issue' button to let us know! We are constantly updating the database.")}
            className="btn-ghost" 
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', cursor: 'pointer', border: 'none', background: 'transparent' }}
          >
            <HelpCircle size={16} /> Program Missing?
          </button>
        </div>
      </div>
    </div>
  );
}
