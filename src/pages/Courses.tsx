import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import {
  BuildingIcon,
  HostelsIcon,
  CheckIcon,
  ClockIcon,
  AlertIcon
} from '../components/Icons';

interface CoursePrereq {
  id: string;
  code: string;
  title: string;
  status: 'MISSING' | 'FAILED' | 'PASSED';
}

interface Course {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  lecturerId: string | null;
  lecturer?: {
    firstName: string;
    lastName: string;
  };
  enrollmentStatus: 'AVAILABLE' | 'PREREQUISITE_FAILED' | 'PREREQUISITE_MISSING';
  enrollmentReason: string;
  prerequisites: CoursePrereq[];
  isCore: boolean;
}

interface Hostel {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  totalCapacity: number;
  allowedLevels: number[];
  description: string | null;
  _count: {
    allocations: number;
  };
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [regStatus, setRegStatus] = useState<'NOT_REGISTERED' | 'PENDING_APPROVAL' | 'APPROVED'>('NOT_REGISTERED');
  const [hostelStatus, setHostelStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE');
  const [allocatedHostelName, setAllocatedHostelName] = useState<string | null>(null);
  
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [maxUnits, setMaxUnits] = useState(24);
  const [minElectives, setMinElectives] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingHostel, setSubmittingHostel] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Accommodation Choice (Step 1)
  const [accommodationTab, setAccommodationTab] = useState<'ON_CAMPUS' | 'OFF_CAMPUS'>('ON_CAMPUS');
  const [offCampusReason, setOffCampusReason] = useState('');
  const [offCampusAddress, setOffCampusAddress] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const statsRes = await api.get('/student/dashboard-stats');
      const academicStats = statsRes.data.academic;
      
      setRegStatus(academicStats.courseRegStatus);
      setHostelStatus(academicStats.hostelStatus);
      setAllocatedHostelName(academicStats.allocatedHostelName);

      if (academicStats.hostelStatus === 'NONE') {
        const hostelsRes = await api.get('/student/hostels').catch(() => ({ data: { data: [] } }));
        setHostels(hostelsRes.data.data || []);
      } else {
        const coursesRes = await api.get('/student/courses/available');
        const availableCourses = coursesRes.data.data || [];
        setCourses(availableCourses);
        setMaxUnits(coursesRes.data.maxUnits || 24);
        setMinElectives(coursesRes.data.minElectives || 0);

        // Pre-select core courses that are available
        const coreIds = availableCourses
          .filter((c: any) => c.isCore && c.enrollmentStatus === 'AVAILABLE')
          .map((c: any) => c.id);
        setSelectedCourseIds(coreIds);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load active academic session data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckboxChange = (course: Course, checked: boolean) => {
    if (checked) {
      // Calculate new total units
      const potentialTotal = selectedCourseIds.reduce((sum, id) => {
        const c = courses.find(item => item.id === id);
        return sum + (c ? c.creditUnits : 0);
      }, 0) + course.creditUnits;

      if (potentialTotal > maxUnits) {
        setErrorMsg(`Cannot select ${course.code}. Total credit units would exceed the maximum allowed limit of ${maxUnits} Units.`);
        return;
      }
      setErrorMsg('');
      setSelectedCourseIds([...selectedCourseIds, course.id]);
    } else {
      setSelectedCourseIds(selectedCourseIds.filter(id => id !== course.id));
    }
  };

  const handleRegister = async () => {
    // 1) Verify core courses are selected
    const availableCoreCourses = courses.filter(c => c.isCore && c.enrollmentStatus === 'AVAILABLE');
    const selectedCoreIds = selectedCourseIds.filter(id => {
      const c = courses.find(item => item.id === id);
      return c && c.isCore;
    });

    if (selectedCoreIds.length < availableCoreCourses.length) {
      setErrorMsg('Please select all available core courses.');
      return;
    }

    // 2) Verify elective courses count
    const selectedElectiveCount = courses.filter(c => !c.isCore && selectedCourseIds.includes(c.id)).length;
    if (minElectives > 0 && selectedElectiveCount < minElectives) {
      setErrorMsg(`Please select at least ${minElectives} elective course(s) to register.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data } = await api.post('/student/courses/register', {
        courseIds: selectedCourseIds
      });
      setSuccessMsg(data.message || 'Course registration submitted successfully.');
      setTimeout(() => {
        loadData();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Registration failed. Please clear tuition balances.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestOnCampus = async (hostelId: string) => {
    setSubmittingHostel(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/student/hostels/allocate', { hostelId });
      setSuccessMsg(data.message || 'Hostel space reserved successfully. Proceeding to course selection.');
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to request hostel space.');
    } finally {
      setSubmittingHostel(false);
    }
  };

  const handleRequestOffCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offCampusReason || !offCampusAddress) {
      setErrorMsg('Reason and Address are required.');
      return;
    }

    setSubmittingHostel(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data } = await api.post('/student/hostels/off-campus', {
        reason: offCampusReason,
        address: offCampusAddress,
        landlordName,
        landlordPhone
      });
      setSuccessMsg(data.message || 'Off-campus request logged. Proceeding to course selection.');
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to log off-campus details.');
    } finally {
      setSubmittingHostel(false);
    }
  };

  const totalSelectedUnits = courses
    .filter(c => selectedCourseIds.includes(c.id))
    .reduce((sum, c) => sum + c.creditUnits, 0);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Semester Registration</div>
          <div className="page-subtitle">
            {hostelStatus === 'NONE' 
              ? 'Step 1: Choose housing accommodation block or log off-campus preference'
              : 'Step 2: Select courses for your current level and submit for academic approval'
            }
          </div>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid var(--danger-500)', borderRadius: 'var(--radius-md)', color: 'var(--danger-400)', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertIcon size={16} /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid var(--success-500)', borderRadius: 'var(--radius-md)', color: 'var(--success-400)', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckIcon size={16} /> {successMsg}
        </div>
      )}

      {/* STEP 1: HOUSING NOT SELECDTED */}
      {hostelStatus === 'NONE' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Informative Warning */}
          <div className="section-card" style={{ margin: 0, padding: 20, background: '#FEFCE8', border: '1px solid #FDE047' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 700, color: '#854D0E', display: 'flex', alignItems: 'center', gap: 8 }}>
              <HostelsIcon size={18} color="#854D0E" />
              <span>Step 1: Accommodation Selection Required</span>
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: '#713F12', lineHeight: 1.5 }}>
              Shanahan University policies require all students to register their hostel block or secure off-campus clearance before selecting courses. Please select an available block or fill the off-campus specification form below.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-default)', paddingBottom: 12 }}>
            <button 
              className={`btn ${accommodationTab === 'ON_CAMPUS' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={() => setAccommodationTab('ON_CAMPUS')}
            >
              <BuildingIcon size={16} />
              <span>On-Campus Hostels</span>
            </button>
            <button 
              className={`btn ${accommodationTab === 'OFF_CAMPUS' ? 'btn-primary' : 'btn-ghost'}`} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              onClick={() => setAccommodationTab('OFF_CAMPUS')}
            >
              <HostelsIcon size={16} />
              <span>Off-Campus Accommodation</span>
            </button>
          </div>

          {accommodationTab === 'ON_CAMPUS' ? (
            /* Hostel Blocks Grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {hostels.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: 'span 3' }}>
                  <div className="empty-state-icon"><BuildingIcon size={48} color="#800020" /></div>
                  <div className="empty-state-title">No hostels available</div>
                  <div className="empty-state-desc">There are no vacant residential blocks configured for your gender/level.</div>
                </div>
              ) : (
                hostels.map((hostel) => {
                  const bedSpacesLeft = hostel.totalCapacity - hostel._count.allocations;
                  const percent = Math.min(Math.round((hostel._count.allocations / hostel.totalCapacity) * 100), 100);

                  return (
                    <div key={hostel.id} className="glass-card" style={{ padding: '24px 28px', border: '1px solid var(--border-default)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(128,0,32,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BuildingIcon size={22} color="#800020" />
                        </div>
                        <span className={`badge badge-${hostel.gender === 'MALE' ? 'info' : 'danger'}`}>
                          {hostel.gender === 'MALE' ? 'Male Block' : 'Female Block'}
                        </span>
                      </div>

                      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{hostel.name}</h3>
                      {hostel.description && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{hostel.description}</p>
                      )}

                      <div className="divider" style={{ margin: '12px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Occupancy Status:</span>
                        <span>{hostel._count.allocations} / {hostel.totalCapacity} beds</span>
                      </div>

                      <div style={{ width: '100%', height: 6, background: 'var(--border-default)', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: percent > 90 ? 'var(--danger-500)' : 'var(--primary-500)' }} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <span style={{ fontSize: 12, color: bedSpacesLeft > 0 ? 'var(--success-500)' : 'var(--danger-500)', fontWeight: 700 }}>
                          {bedSpacesLeft > 0 ? `${bedSpacesLeft} bed spaces vacant` : 'Fully Occupied'}
                        </span>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleRequestOnCampus(hostel.id)}
                          disabled={submittingHostel || bedSpacesLeft <= 0}
                        >
                          {submittingHostel ? 'Requesting...' : 'Request Space'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Off-Campus Form */
            <div className="section-card" style={{ maxWidth: 600, margin: '0 auto' }}>
              <div className="section-card-header">
                <h3 className="section-card-title">Off-Campus Specification Form</h3>
              </div>
              <form onSubmit={handleRequestOffCampus} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Stated Reason for Off-Campus Accommodation</label>
                  <textarea 
                    className="form-control" 
                    style={{ minHeight: 80, padding: '10px 14px' }}
                    placeholder="e.g. Parental accommodation in town, medical recommendation, etc."
                    value={offCampusReason}
                    onChange={(e) => setOffCampusReason(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Off-Campus Residential Address</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. No. 12 Cathedral Street, Onitsha"
                    value={offCampusAddress}
                    onChange={(e) => setOffCampusAddress(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Landlord Name (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Mr. Okey"
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Landlord Phone (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="080..."
                      value={landlordPhone}
                      onChange={(e) => setLandlordPhone(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={submittingHostel}
                >
                  {submittingHostel ? 'Submitting Application...' : 'Submit & Proceed to Course Selection'}
                </button>
              </form>
            </div>
          )}
        </div>
      ) : regStatus !== 'NOT_REGISTERED' ? (
        /* Render Already Registered Receipt Status */
        <div className="section-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {regStatus === 'APPROVED'
              ? <CheckIcon size={54} color="var(--success-500)" />
              : <ClockIcon size={54} color="#B8860B" />}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            {regStatus === 'APPROVED' ? 'Registration Approved!' : 'Registration Pending Approval'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
            {regStatus === 'APPROVED' 
              ? 'Your departmental officer has approved your selected courses. You are fully registered for this semester.'
              : 'Your selected course outline is currently under review by your course advisor / department officer.'}
          </p>

          <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', maxWidth: 500, margin: '0 auto', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
            <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Registered Semester Courses</div>
            <table className="data-table" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-200)' }}>{c.code}</span></td>
                    <td>{c.title}</td>
                    <td><span className="badge badge-neutral">{c.creditUnits} Units</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STEP 2: COURSE SELECTION FORM */
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 24, alignItems: 'start' }}>
          {/* Courses List Split */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Core Courses Section */}
            <div className="section-card" style={{ margin: 0, padding: 0 }}>
              <div className="section-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Mandatory Core Courses</h4>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Code</th>
                      <th>Course Title</th>
                      <th>Credit Units</th>
                      <th>Prerequisites / Restrictions</th>
                      <th>Assigned Lecturer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.filter(c => c.isCore).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No core courses available for this period.</td>
                      </tr>
                    ) : (
                      courses.filter(c => c.isCore).map((c) => {
                        const isPrereqFailed = c.enrollmentStatus === 'PREREQUISITE_FAILED';
                        const isPrereqMissing = c.enrollmentStatus === 'PREREQUISITE_MISSING';
                        const isDisabled = isPrereqFailed || isPrereqMissing || c.isCore; // Core is disabled (mandatory check)

                        return (
                          <tr key={c.id} style={{ opacity: (isPrereqFailed || isPrereqMissing) ? 0.65 : 1 }}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedCourseIds.includes(c.id)}
                                disabled={isDisabled}
                                style={{ width: 16, height: 16, cursor: 'not-allowed' }}
                                readOnly
                              />
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-200)' }}>
                                {c.code}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{c.title}</td>
                            <td><span className="badge badge-neutral">{c.creditUnits} Units</span></td>
                            <td>
                              {c.prerequisites.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {c.prerequisites.map(p => (
                                    <span 
                                      key={p.id} 
                                      className={`badge ${p.status === 'PASSED' ? 'badge-success' : p.status === 'FAILED' ? 'badge-danger' : 'badge-neutral'}`}
                                      style={{ fontSize: 10, padding: '1px 6px' }}
                                    >
                                      Req: {p.code} ({p.status === 'PASSED' ? 'Passed' : p.status === 'FAILED' ? 'Failed' : 'Pending'})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>None</span>
                              )}
                              {(isPrereqFailed || isPrereqMissing) && (
                                <div style={{ color: 'var(--danger-400)', fontSize: 11, marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <AlertIcon size={12} color="var(--danger-400)" /> {c.enrollmentReason}
                                </div>
                              )}
                            </td>
                            <td>
                              {c.lecturer ? (
                                <span>{c.lecturer.firstName} {c.lecturer.lastName}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>TBA</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Elective Courses Section */}
            <div className="section-card" style={{ margin: 0, padding: 0 }}>
              <div className="section-card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Elective Courses</h4>
                <span className={`badge ${courses.filter(c => !c.isCore && selectedCourseIds.includes(c.id)).length >= minElectives ? 'badge-gold' : 'badge-neutral'}`} style={{ fontSize: 12 }}>
                  Selected: {courses.filter(c => !c.isCore && selectedCourseIds.includes(c.id)).length} of at least {minElectives} required
                </span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Code</th>
                      <th>Course Title</th>
                      <th>Credit Units</th>
                      <th>Prerequisites / Restrictions</th>
                      <th>Assigned Lecturer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.filter(c => !c.isCore).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No elective courses available for this period.</td>
                      </tr>
                    ) : (
                      courses.filter(c => !c.isCore).map((c) => {
                        const isPrereqFailed = c.enrollmentStatus === 'PREREQUISITE_FAILED';
                        const isPrereqMissing = c.enrollmentStatus === 'PREREQUISITE_MISSING';
                        const isDisabled = isPrereqFailed || isPrereqMissing;

                        return (
                          <tr key={c.id} style={{ opacity: isDisabled ? 0.65 : 1 }}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedCourseIds.includes(c.id)}
                                disabled={isDisabled}
                                onChange={(e) => handleCheckboxChange(c, e.target.checked)}
                                style={{ width: 16, height: 16, cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                              />
                            </td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: isDisabled ? 'var(--text-muted)' : 'var(--primary-200)' }}>
                                {c.code}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{c.title}</td>
                            <td><span className="badge badge-neutral">{c.creditUnits} Units</span></td>
                            <td>
                              {c.prerequisites.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {c.prerequisites.map(p => (
                                    <span 
                                      key={p.id} 
                                      className={`badge ${p.status === 'PASSED' ? 'badge-success' : p.status === 'FAILED' ? 'badge-danger' : 'badge-neutral'}`}
                                      style={{ fontSize: 10, padding: '1px 6px' }}
                                    >
                                      Req: {p.code} ({p.status === 'PASSED' ? 'Passed' : p.status === 'FAILED' ? 'Failed' : 'Pending'})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>None</span>
                              )}
                              {isDisabled && (
                                <div style={{ color: 'var(--danger-400)', fontSize: 11, marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <AlertIcon size={12} color="var(--danger-400)" /> {c.enrollmentReason}
                                </div>
                              )}
                            </td>
                            <td>
                              {c.lecturer ? (
                                <span>{c.lecturer.firstName} {c.lecturer.lastName}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>TBA</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Registration Slip Summary Column */}
          <div className="section-card" style={{ margin: 0 }}>
            <div className="section-card-header">
              <h3 className="section-card-title">Registration Summary</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Selected Courses:</span>
                <span style={{ fontWeight: 700 }}>{selectedCourseIds.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Credit Units:</span>
                <span style={{ fontWeight: 700, color: totalSelectedUnits > maxUnits ? 'var(--danger-400)' : 'var(--primary-200)' }}>
                  {totalSelectedUnits} / {maxUnits} Units
                </span>
              </div>

              {totalSelectedUnits > 0 && (
                <div style={{ width: '100%', height: 6, background: 'var(--border-default)', borderRadius: 3, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${Math.min((totalSelectedUnits / maxUnits) * 100, 100)}%`, 
                      height: '100%', 
                      background: totalSelectedUnits === maxUnits ? 'var(--accent-500)' : 'var(--primary-500)' 
                    }} 
                  />
                </div>
              )}

              <div className="divider" style={{ margin: '8px 0' }} />

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <HostelsIcon size={15} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Housing preference specified:</strong>
                  <div style={{ color: 'var(--success-400)', marginTop: 2, fontWeight: 700 }}>
                    {hostelStatus === 'APPROVED' ? `Allocated: ${allocatedHostelName}` : 'Bed space reserved (Awaiting fee completion)'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                <AlertIcon size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Enforce Payment Rule: Submission requires you to have cleared at least 50% of your tuition fees for this semester.</span>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={handleRegister}
                disabled={submitting || selectedCourseIds.length === 0}
              >
                {submitting ? 'Submitting Registration...' : 'Submit Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
