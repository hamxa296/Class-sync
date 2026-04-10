import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, X, ChevronLeft, Save, Info, Loader2 } from 'lucide-react';
import { DATA, GRADING_SCALE } from '../data/faculties';
import { db, loginAnonymously, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function CalculatorPage() {
  const { facultyIdx, programIdx, semesterIdx } = useParams();
  
  // 1. Instant Default Calculation (The Illusion of Speed)
  const getDefaultCourses = () => {
    const fIdx = Number(facultyIdx);
    const pIdx = Number(programIdx);
    const sIdx = Number(semesterIdx);
    
    const faculty = DATA.faculties[fIdx];
    const program = faculty?.programs[pIdx];
    const semester = program?.semesters[sIdx];

    if (semester) {
      return semester.courses.map((course, i) => ({
        id: `preset_${course.code}_${i}`,
        name: course.name,
        code: course.code,
        creditHours: parseInt(course.ch),
        grade: 'A',
        isCustom: false
      }));
    }
    return [];
  };

  const [courses, setCourses] = useState(getDefaultCourses());
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseCH, setNewCourseCH] = useState(3);
  const [showAddForm, setShowAddForm] = useState(false);
  const [visibleNames, setVisibleNames] = useState({});
  const [user, setUser] = useState(auth.currentUser);
  const [isSaving, setIsSaving] = useState(false);
  const [syncing, setSyncing] = useState(true);

  // Unique key for this specific semester plan in Firestore
  const planId = `${facultyIdx}_${programIdx}_${semesterIdx}`;

  useEffect(() => {
    const syncData = async () => {
      setSyncing(true);
      try {
        // Use global session if available, otherwise login
        const loggedUser = auth.currentUser || await loginAnonymously();
        setUser(loggedUser);

        const planRef = doc(db, 'users', loggedUser.uid, 'plans', planId);
        const planSnap = await getDoc(planRef);

        if (planSnap.exists()) {
          setCourses(planSnap.data().courses);
        }
      } catch (err) {
        console.error("Sync error:", err);
      } finally {
        setSyncing(false);
      }
    };

    syncData();

    // Global click listener to close popups
    const handleGlobalClick = () => {
      setVisibleNames({});
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [facultyIdx, programIdx, semesterIdx, planId]);

  const saveToFirebase = async (updatedCourses) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const planRef = doc(db, 'users', user.uid, 'plans', planId);
      await setDoc(planRef, {
        courses: updatedCourses,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNameVisibility = (e, id) => {
    e.stopPropagation();
    setVisibleNames(prev => ({ ...prev, [id]: !prev[id] }));
  };
  
  const hideName = (id) => {
    setVisibleNames(prev => ({ ...prev, [id]: false }));
  };

  const handleGradeChange = (id, newGrade) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, grade: newGrade } : c));
  };

  const removeCourse = (id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const addCourse = (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;
    
    const newCourse = {
      id: `custom_${Date.now()}`,
      name: newCourseName,
      code: newCourseCode.trim() || 'Custom',
      creditHours: parseInt(newCourseCH),
      grade: 'A',
      isCustom: true
    };
    
    setCourses([...courses, newCourse]);
    setNewCourseName('');
    setNewCourseCode('');
    setNewCourseCH(3);
    setShowAddForm(false);
  };

  const calculateGPA = () => {
    if (courses.length === 0) return 0;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    courses.forEach(course => {
      const gradeRule = GRADING_SCALE.find(g => g.grade === course.grade);
      const points = gradeRule ? gradeRule.points : 0;
      totalPoints += (points * course.creditHours);
      totalCredits += course.creditHours;
    });
    
    return totalCredits === 0 ? 0 : (totalPoints / totalCredits).toFixed(2);
  };

  const gpa = calculateGPA();
  const totalCH = courses.reduce((sum, c) => sum + Number(c.creditHours), 0);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="btn btn-ghost" style={{ padding: '0.5rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ChevronLeft size={18} /> Back to Selection
        </Link>
        {syncing && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 className="animate-spin" size={14} /> Cloud Syncing...
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>Your Course Configuration</h2>
            <p>{syncing ? 'Verifying records...' : 'Customize your grades for the semester.'}</p>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => saveToFirebase(courses)} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Saving...
              </>
            ) : (
              <>
                <Save size={18} /> Save Plan
              </>
            )}
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <p>No courses found for this selection. Start by adding custom courses.</p>
          </div>
        ) : (
          <div className="course-list">
            {courses.map(course => (
              <div 
                key={course.id} 
                className="course-item"
                onMouseLeave={() => hideName(course.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="course-name" style={{ lineHeight: '1.2', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', position: 'relative' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{course.code || 'Custom'}</span>
                      <button 
                        onClick={(e) => toggleNameVisibility(e, course.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }}
                        title="Show course name"
                      >
                        <Info size={14} />
                      </button>

                      {visibleNames[course.id] && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: '0', 
                          zIndex: 100, 
                          marginTop: '8px',
                          backgroundColor: 'var(--surface-color-light)', 
                          padding: '0.75rem', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)',
                          boxShadow: 'var(--shadow-lg)',
                          width: 'max-content',
                          maxWidth: '200px',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          lineHeight: '1.4'
                        }}>
                          {course.name}
                        </div>
                      )}
                    </div>
                    {course.isCustom && <div style={{ fontSize: '0.75rem', backgroundColor: 'var(--border-color)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.5rem', color: 'var(--text-secondary)', display: 'inline-block' }}>Custom</div>}
                  </div>
                  <div className="course-ch" style={{ flexShrink: 0, marginLeft: '0.5rem', opacity: 0.8, fontSize: '0.9rem' }}>{course.creditHours} CH</div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <div style={{ flex: 1, marginRight: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade</div>
                    <select 
                      className="form-select" 
                      value={course.grade}
                      style={{ padding: '0.4rem', fontSize: '0.95rem' }}
                      onChange={(e) => handleGradeChange(course.id, e.target.value)}
                    >
                      {GRADING_SCALE.map(scale => (
                        <option key={scale.grade} value={scale.grade}>{scale.grade} ({scale.points})</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    className="btn-drop" 
                    onClick={() => removeCourse(course.id)}
                    aria-label="Drop Course"
                  >
                    Drop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!showAddForm ? (
            <button 
              className="btn btn-ghost" 
              style={{ border: '1px dashed rgba(255, 255, 255, 0.2)', width: '100%', padding: '1.5rem', color: 'var(--text-secondary)' }}
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={20} /> Add Custom Course
            </button>
          ) : (
            <div style={{ width: '100%', backgroundColor: 'var(--surface-color-light)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Add Extra Course</h3>
                <button 
                  className="btn-ghost" 
                  style={{ padding: '0.25rem', cursor: 'pointer', border: 'none', color: 'var(--text-secondary)', background: 'transparent' }} 
                  onClick={() => setShowAddForm(false)} 
                  aria-label="Cancel"
                >
                  <X size={20} />
                </button>
              </div>
              <form className="add-course-form" onSubmit={addCourse} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="newCourseCode">Code</label>
                  <input 
                    id="newCourseCode"
                    className="form-input" 
                    placeholder="e.g. CS101" 
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="newCourseName">Course Name</label>
                  <input 
                    id="newCourseName"
                    className="form-input" 
                    placeholder="e.g. Graphic Design" 
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="newCourseCH">Credits</label>
                  <select 
                    id="newCourseCH"
                    className="form-select"
                    value={newCourseCH}
                    onChange={(e) => setNewCourseCH(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>{num} CH</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem 1rem' }} disabled={!newCourseName.trim()}>
                  <Plus size={20} /> Add
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="gpa-display">
        <div>
          <div className="gpa-label">Estimated Semester GPA</div>
          <div style={{ color: 'var(--text-secondary)' }}>Based on {totalCH} Total Credit Hours</div>
        </div>
        <div className="gpa-value">{gpa}</div>
      </div>
    </div>
  );
}
