import { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertIcon, PrinterIcon, CoursesIcon } from '../components/Icons';

interface CourseDetail {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
}

interface RegisteredCourse {
  id: string;
  courseId: string;
  caScore: number | null;
  examScore: number | null;
  grade: string | null;
  gradePoint: number | null;
  course: CourseDetail;
}

interface RegistrationRecord {
  id: string;
  sessionId: string;
  semesterId: string;
  level: number;
  isApproved: boolean;
  session: {
    id: string;
    name: string;
  };
  semester: {
    id: string;
    name: string;
  };
  courses: RegisteredCourse[];
}

export default function Results() {
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('ALL');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get('/student/results');
        const regs: RegistrationRecord[] = res.data.data || [];
        setRegistrations(regs);
        setStudent(res.data.student || null);
        if (regs.length > 0) {
          // Default to the most recent session
          setSelectedSessionId(regs[0].sessionId);
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load academic results. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Retrieving academic transcripts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><AlertIcon size={48} color="var(--warning-500)" /></div>
        <div className="empty-state-title">Error Loading Results</div>
        <div className="empty-state-desc">{error}</div>
      </div>
    );
  }

  // Get unique sessions for dropdown
  const uniqueSessionsMap: Record<string, string> = {};
  registrations.forEach(r => {
    uniqueSessionsMap[r.sessionId] = r.session.name;
  });
  const uniqueSessions = Object.entries(uniqueSessionsMap).map(([id, name]) => ({ id, name }));

  // Get active registration matching selection
  const selectedRegs = registrations.filter(r => r.sessionId === selectedSessionId);

  // Get semesters in this session
  const uniqueSemestersMap: Record<string, string> = {};
  selectedRegs.forEach(r => {
    uniqueSemestersMap[r.semesterId] = r.semester.name;
  });
  const uniqueSemesters = Object.entries(uniqueSemestersMap).map(([id, name]) => ({ id, name }));

  // Filter courses based on semester selection
  let filteredCourses: RegisteredCourse[] = [];
  let currentLevel = 100;
  
  const activeRegs = selectedSemesterId === 'ALL'
    ? selectedRegs
    : selectedRegs.filter(r => r.semesterId === selectedSemesterId);

  activeRegs.forEach(r => {
    filteredCourses = [...filteredCourses, ...r.courses];
    currentLevel = r.level; // track level of selection
  });

  // Calculate GPA
  let totalPoints = 0;
  let totalCredits = 0;
  let gradedCoursesCount = 0;

  filteredCourses.forEach(rc => {
    if (rc.gradePoint !== null && rc.gradePoint !== undefined && rc.caScore !== null && rc.examScore !== null) {
      totalPoints += rc.gradePoint * rc.course.creditUnits;
      totalCredits += rc.course.creditUnits;
      gradedCoursesCount++;
    }
  });

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, aside, header, footer, .no-print, .btn, .page-header, .filters-bar, .section-card {
            display: none !important;
          }
          .main-content, .content-wrapper, .animate-fade {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            color: #000 !important;
            background: #fff !important;
            padding: 20px !important;
          }
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            color: #000 !important;
            background: transparent !important;
          }
          .print-table th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
          }
          .print-badge {
            border: 1px solid #333 !important;
            padding: 2px 6px !important;
            font-size: 11px !important;
            font-weight: bold !important;
            color: #000 !important;
            border-radius: 4px !important;
          }
        }
        @media screen {
          .print-container {
            display: none;
          }
        }
      `}</style>

      {/* Screen Title block */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Academic Results & GPA</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            View and download your official sessional and semester grades.
          </p>
        </div>
        <div>
          {filteredCourses.length > 0 && (
            <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <PrinterIcon size={16} /> Print Result Slip
            </button>
          )}
        </div>
      </div>

      {/* Selector and GPA summary cards (Screen Only) */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, alignItems: 'start' }}>
        {/* Filters Card */}
        <div className="section-card" style={{ margin: 0 }}>
          <div className="section-card-header">
            <h3 className="section-card-title">Select Academic Period</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Academic Session</label>
              <select
                className="form-control"
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  setSelectedSemesterId('ALL');
                }}
              >
                {uniqueSessions.length === 0 ? (
                  <option value="">No approved registrations found</option>
                ) : (
                  uniqueSessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name} Session</option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Semester</label>
              <select
                className="form-control"
                value={selectedSemesterId}
                onChange={(e) => setSelectedSemesterId(e.target.value)}
                disabled={uniqueSessions.length === 0}
              >
                <option value="ALL">All Semesters</option>
                {uniqueSemesters.map(sem => (
                  <option key={sem.id} value={sem.id}>{sem.name} Semester</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* GPA Box */}
        <div className="section-card" style={{ margin: 0, background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-default)' }}>
          <div className="section-card-header">
            <h3 className="section-card-title">Grade Point Average (GPA) Summary</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                {selectedSemesterId === 'ALL' ? 'Sessional GPA' : 'Semester GPA'}
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: 'var(--primary-200)', marginTop: 8, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                {gpa}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                Current Level: <strong style={{ color: 'var(--text-primary)' }}>{currentLevel}L</strong> | Total Credit Units: <strong style={{ color: 'var(--text-primary)' }}>{totalCredits}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table (Screen Only) */}
      <div className="section-card no-print" style={{ margin: 0 }}>
        <div className="section-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="section-card-title">Registered Courses & Sessional Marks</h3>
          <span className="badge badge-gold" style={{ fontSize: 11 }}>Approved Course Registration</span>
        </div>

        {filteredCourses.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><CoursesIcon size={36} color="var(--text-muted)" /></div>
            <div>No approved course registration records for the selected period.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Course Code</th>
                  <th style={{ textAlign: 'left' }}>Course Title</th>
                  <th style={{ textAlign: 'center' }}>Units</th>
                  <th style={{ textAlign: 'center' }}>CA (40)</th>
                  <th style={{ textAlign: 'center' }}>Exam (60)</th>
                  <th style={{ textAlign: 'center' }}>Total (100)</th>
                  <th style={{ textAlign: 'center' }}>Letter Grade</th>
                  <th style={{ textAlign: 'center' }}>GP</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((rc) => {
                  const hasCa = rc.caScore !== null;
                  const hasExam = rc.examScore !== null;
                  const total = hasCa && hasExam ? (rc.caScore! + rc.examScore!) : null;

                  return (
                    <tr key={rc.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-200)', fontFamily: 'monospace' }}>
                        {rc.course.code}
                      </td>
                      <td style={{ color: 'var(--text-primary)' }}>{rc.course.title}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{rc.course.creditUnits}</td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                        {hasCa ? rc.caScore : '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
                        {hasExam ? rc.examScore : '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>
                        {total !== null ? total : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {rc.grade ? (
                          <span className={`badge ${rc.grade === 'F' ? 'badge-danger' : 'badge-gold'}`} style={{ minWidth: 28, display: 'inline-block', textAlign: 'center' }}>
                            {rc.grade}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pending</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                        {rc.gradePoint !== null ? rc.gradePoint.toFixed(1) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Printed Result Slip (Hidden on Screen, Visible on Print) */}
      <div className="print-container">
        <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #000', paddingBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '1px' }}>SHANAHAN UNIVERSITY</h2>
          <p style={{ margin: '4px 0', fontSize: 12, color: '#555', fontWeight: 600 }}>OFFICE OF THE REGISTRAR (EXAMS & RECORDS)</p>
          <h3 style={{ margin: '12px 0 0 0', fontSize: 16, fontWeight: 700, letterSpacing: '0.5px', textDecoration: 'underline' }}>
            OFFICIAL ACADEMIC RESULT SLIP
          </h3>
        </div>

        {student && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, fontSize: 13 }}>
            <div>
              <div style={{ margin: '4px 0' }}><strong>Student Name:</strong> {student.lastName}, {student.firstName}</div>
              <div style={{ margin: '4px 0' }}><strong>Matriculation Number:</strong> {student.matricNumber}</div>
              <div style={{ margin: '4px 0' }}><strong>Gender:</strong> {student.gender}</div>
            </div>
            <div>
              <div style={{ margin: '4px 0' }}><strong>Faculty:</strong> {student.department?.faculty?.name || student.department?.name}</div>
              <div style={{ margin: '4px 0' }}><strong>Department:</strong> {student.department?.name}</div>
              <div style={{ margin: '4px 0' }}><strong>Degree Programme:</strong> {student.program?.name}</div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16, fontSize: 13, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
          <strong>Academic Period:</strong> {registrations.find(r => r.sessionId === selectedSessionId)?.session?.name} Session 
          {selectedSemesterId !== 'ALL' && ` | ${registrations.find(r => r.semesterId === selectedSemesterId)?.semester?.name} Semester`}
          {` | Level: ${currentLevel}L`}
        </div>

        <table className="print-table" style={{ width: '100%', marginBottom: 24 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Course Code</th>
              <th style={{ textAlign: 'left' }}>Course Title</th>
              <th style={{ textAlign: 'center' }}>Units</th>
              <th style={{ textAlign: 'center' }}>CA (40)</th>
              <th style={{ textAlign: 'center' }}>Exam (60)</th>
              <th style={{ textAlign: 'center' }}>Total (100)</th>
              <th style={{ textAlign: 'center' }}>Grade</th>
              <th style={{ textAlign: 'center' }}>GP</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map((rc) => {
              const hasCa = rc.caScore !== null;
              const hasExam = rc.examScore !== null;
              const total = hasCa && hasExam ? (rc.caScore! + rc.examScore!) : null;

              return (
                <tr key={rc.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{rc.course.code}</td>
                  <td>{rc.course.title}</td>
                  <td style={{ textAlign: 'center' }}>{rc.course.creditUnits}</td>
                  <td style={{ textAlign: 'center' }}>{hasCa ? rc.caScore : '-'}</td>
                  <td style={{ textAlign: 'center' }}>{hasExam ? rc.examScore : '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{total !== null ? total : '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="print-badge">{rc.grade || 'Pending'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{rc.gradePoint !== null ? rc.gradePoint.toFixed(1) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #000', padding: 12, fontSize: 13, marginBottom: 40 }}>
          <div><strong>Total Credits Registered:</strong> {totalCredits}</div>
          <div><strong>Total Grade Points:</strong> {totalPoints.toFixed(1)}</div>
          <div><strong>GPA:</strong> <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>{gpa}</span></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40, fontSize: 12, textAlign: 'center' }}>
          <div>
            <div style={{ borderBottom: '1px dashed #000', height: 40 }}></div>
            <div style={{ marginTop: 8 }}><strong>Student Signature / Date</strong></div>
          </div>
          <div>
            <div style={{ borderBottom: '1px dashed #000', height: 40 }}></div>
            <div style={{ marginTop: 8 }}><strong>Registrar / Date</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
