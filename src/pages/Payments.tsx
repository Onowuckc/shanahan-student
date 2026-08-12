import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { PaymentsIcon, AlertIcon, CheckIcon } from '../components/Icons';

interface FeeItem {
  id: string;
  feeCategory: { name: string };
  amount: number;
}

interface Payment {
  id: string;
  sessionId: string;
  session: { name: string };
  semesterId: string;
  semester: { name: string };
  amountDue: number;
  amountPaid: number;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED';
  paymentDate: string | null;
  txReference: string | null;
  items: FeeItem[];
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal State
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [initializing, setInitializing] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/payments');
      setPayments(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Handle automatic verification on callback redirect
  useEffect(() => {
    const reference = searchParams.get('reference');
    if (reference) {
      // Clear the query parameter so refreshing doesn't verify again
      setSearchParams({}, { replace: true });
      
      // Configure modal states to show verification
      setTxRef(reference);
      setShowPayModal(true);
      setVerifying(true);
      setErrorMsg('');
      setSuccessMsg('');
      
      api.post('/student/payments/verify', { reference })
        .then(() => {
          setSuccessMsg(`Payment verified successfully!`);
          fetchPayments();
          setTimeout(() => {
            setShowPayModal(false);
          }, 3000);
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg(err.response?.data?.error || 'Verification failed. Please retry.');
        })
        .finally(() => {
          setVerifying(false);
        });
    }
  }, [searchParams, setSearchParams, fetchPayments]);

  const handleOpenPayModal = (payment: Payment) => {
    setSelectedPayment(payment);
    const outstanding = payment.amountDue - payment.amountPaid;
    setPayAmount(String(outstanding)); // default to full outstanding amount
    setTxRef('');
    setAuthUrl('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowPayModal(true);
  };

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !payAmount) return;

    setInitializing(true);
    setErrorMsg('');
    try {
      const { data } = await api.post('/student/payments/initialize', {
        paymentId: selectedPayment.id,
        amount: parseFloat(payAmount),
        callbackUrl: window.location.origin + '/payments'
      });
      setTxRef(data.data.reference);
      setAuthUrl(data.data.authorization_url);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to initialize payment.');
    } finally {
      setInitializing(false);
    }
  };

  const handleSimulateVerify = async () => {
    if (!txRef) return;

    setVerifying(true);
    setErrorMsg('');
    try {
      await api.post('/student/payments/verify', { reference: txRef, simulate: true });
      setSuccessMsg(`Payment of ₦${parseFloat(payAmount).toLocaleString()} verified successfully!`);
      setTimeout(() => {
        setShowPayModal(false);
        fetchPayments();
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Verification failed. Please retry.');
    } finally {
      setVerifying(false);
    }
  };

  const handleGatewayProceed = () => {
    if (!authUrl) return;
    if (authUrl.includes('SU_MOCK_') || !authUrl.includes('checkout.paystack.com')) {
      handleSimulateVerify();
    } else {
      window.location.href = authUrl;
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <div className="page-title">Fee Ledger & Payments</div>
          <div className="page-subtitle">Track your invoices, review breakdowns, and process transactions</div>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading financial ledger...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><PaymentsIcon size={48} color="#800020" /></div>
            <div className="empty-state-title">No invoices found</div>
            <div className="empty-state-desc">You currently have no fee allocations assigned.</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Academic Period</th>
                <th>Invoiced Categories</th>
                <th>Total Invoiced</th>
                <th>Amount Paid</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const outstanding = p.amountDue - p.amountPaid;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.session.name} Session</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.semester.name} Semester</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {p.items.map(item => (
                          <span key={item.id} className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                            {item.feeCategory.name}: ₦{item.amount.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>₦{p.amountDue.toLocaleString()}</td>
                    <td style={{ color: 'var(--success-500)', fontWeight: 600 }}>₦{p.amountPaid.toLocaleString()}</td>
                    <td style={{ color: outstanding > 0 ? 'var(--danger-500)' : 'var(--text-muted)', fontWeight: 700 }}>
                      ₦{outstanding.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status === 'COMPLETED' ? 'success' : p.status === 'PARTIAL' ? 'warning' : 'danger'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {outstanding > 0 ? (
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenPayModal(p)}>
                          Pay Now
                        </button>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckIcon size={12} /> Fully Cleared</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Modal */}
      {showPayModal && selectedPayment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Fee Checkout</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'rgba(74,14,23,0.08)', border: 'none', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {errorMsg && (
                <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger-500)', borderRadius: 'var(--radius-md)', color: 'var(--danger-500)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertIcon size={16} color="var(--danger-500)" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid var(--success-500)', borderRadius: 'var(--radius-md)', color: 'var(--success-500)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckIcon size={16} color="var(--success-500)" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div>
                <strong>Invoiced For:</strong> {selectedPayment.session.name} Session — {selectedPayment.semester.name} Semester
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                <div>Total Due: <strong>₦{selectedPayment.amountDue.toLocaleString()}</strong></div>
                <div>Paid: <strong style={{ color: 'var(--success-500)' }}>₦{selectedPayment.amountPaid.toLocaleString()}</strong></div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-default)', paddingTop: 8, marginTop: 4 }}>
                  Outstanding Balance: <strong style={{ color: 'var(--danger-400)' }}>₦{(selectedPayment.amountDue - selectedPayment.amountPaid).toLocaleString()}</strong>
                </div>
              </div>

              {!txRef ? (
                /* Stage 1: Choose amount to pay */
                <form onSubmit={handleInitialize} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Payment Amount (₦)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 50000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      max={selectedPayment.amountDue - selectedPayment.amountPaid}
                      required
                    />
                    {selectedPayment.amountPaid === 0 && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                        <AlertIcon size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>Installment Allowed: Minimum first payment must be at least 50% (₦{(selectedPayment.amountDue * 0.5).toLocaleString()})</span>
                      </span>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={initializing}>
                    {initializing ? 'Initializing Transaction...' : 'Initialize Payment'}
                  </button>
                </form>
              ) : (
                /* Stage 2: Checkout Action */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Transaction reference generated:<br />
                    <code style={{ fontSize: 12, background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>{txRef}</code>
                  </div>

                  <div className="divider" style={{ width: '100%', margin: '12px 0' }} />

                  {/* Option 1: Gateway Checkout */}
                  <button
                    type="button"
                    onClick={handleGatewayProceed}
                    className="btn btn-gold"
                    style={{ width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, color: '#4A0E17' }}
                    disabled={verifying}
                  >
                    <PaymentsIcon size={18} />
                    <span>Pay via Paystack Gateway</span>
                  </button>

                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>- OR -</div>

                  {/* Option 2: Mock simulator for offline/test environments */}
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    onClick={handleSimulateVerify}
                    disabled={verifying}
                  >
                    <CheckIcon size={18} />
                    <span>Instant Test Simulation</span>
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowPayModal(false)} disabled={verifying}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
