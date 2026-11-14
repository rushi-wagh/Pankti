import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, Check, ChevronRight, Clock3, Plus, Ticket, TrendingUp, Users, XCircle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../lib/api';
import Shell from '../components/Shell';
import Stat from '../components/Stat';
import Modal from '../components/Modal';

const chartColors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f97316'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [queues, setQueues] = useState([]);
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [creating, setCreating] = useState(false);
  const nav = useNavigate();

  async function load() {
    const [analytics, queueList] = await Promise.all([api.get('/analytics'), api.get('/queues')]);
    setData(analytics.data);
    setQueues(queueList.data);
  }

  useEffect(() => {
    load().catch(() => setErr('Unable to load dashboard data. Please refresh the page.'));
  }, []);

  async function create(event) {
    event.preventDefault();
    setCreating(true);
    setErr('');
    try {
      const { data: created } = await api.post('/queues', { name });
      setName('');
      setShow(false);
      nav(`/queues/${created.id}`);
    } catch (error) {
      setErr(error.response?.data?.error || 'Could not create queue');
    } finally {
      setCreating(false);
    }
  }

  const distribution = data ? [
    { name: 'Waiting', value: data.waiting },
    { name: 'Serving', value: data.serving },
    { name: 'Completed', value: data.completed },
    { name: 'Cancelled', value: data.cancelled }
  ].filter(item => item.value > 0) : [];

  return (
    <Shell>
      <header className="topbar">
        <div>
          <p className="eyebrow">WORKSPACE / OVERVIEW</p>
          <h1>Good day<span className="heading-period">.</span></h1>
          <p className="muted">Here's what's happening across your queues.</p>
        </div>
        <button className="primary" onClick={() => setShow(true)}><Plus size={17} />Create queue</button>
      </header>

      {err && <div className="error banner">{err}<button onClick={() => setErr('')}>Dismiss</button></div>}

      {data ? <>
        <section className="stats">
          <Stat icon={<Users />} label="People waiting" value={data.waiting} tone="blue" />
          <Stat icon={<Activity />} label="Currently serving" value={data.serving} tone="violet" />
          <Stat icon={<Clock3 />} label="Avg. wait time" value={`${data.averageWaitMinutes ?? 0}m`} tone="blue" />
          <Stat icon={<Check />} label="Completed tokens" value={data.completed} tone="green" />
          <Stat icon={<XCircle />} label="Cancelled tokens" value={data.cancelled} tone="orange" />
        </section>

        <section className="content-grid" id="analytics">
          <div className="panel chart-panel">
            <div className="panel-head">
              <div><h2>Queue activity</h2><p className="muted">Tokens added over the last 7 days</p></div>
              <span className="chart-tag"><TrendingUp size={14} />Last 7 days</span>
            </div>
            <div className="chart"><ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs><linearGradient id="queueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#26364d" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8291a8', fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#8291a8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111d30', border: '1px solid #2a3b54', borderRadius: 10, color: '#e5edf8' }} />
                <Area type="monotone" dataKey="tokens" name="Tokens" stroke="#60a5fa" strokeWidth={2.5} fill="url(#queueFill)" />
              </AreaChart>
            </ResponsiveContainer></div>
          </div>

          <div className="panel distribution-panel">
            <div className="panel-head"><div><h2>Token distribution</h2><p className="muted">Current status breakdown</p></div></div>
            <div className="donut-wrap">
              {distribution.length ? <ResponsiveContainer width="100%" height="100%"><PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="88%" paddingAngle={4} stroke="none">
                  {distribution.map((item, index) => <Cell key={item.name} fill={chartColors[['Waiting', 'Serving', 'Completed', 'Cancelled'].indexOf(item.name)]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111d30', border: '1px solid #2a3b54', borderRadius: 10, color: '#e5edf8' }} />
              </PieChart></ResponsiveContainer> : <div className="donut-empty">No tokens yet</div>}
              <div className="donut-center"><strong>{data.waiting + data.serving + data.completed + data.cancelled}</strong><span>Total tokens</span></div>
            </div>
            <div className="legend-grid">{[
              ['Waiting', data.waiting], ['Serving', data.serving], ['Completed', data.completed], ['Cancelled', data.cancelled]
            ].map(([label, value], index) => <div className="legend-item" key={label}><span className="legend-dot" style={{ background: chartColors[index] }} /><span>{label}</span><b>{value}</b></div>)}</div>
          </div>
        </section>

        <section className="panel queue-panel">
          <div className="panel-head"><div><h2>Your queues</h2><p className="muted">Manage your service lines</p></div><button className="text-btn" onClick={() => nav('/queues')}>View all<ChevronRight size={15} /></button></div>
          {queues.length ? <div className="queue-grid">{queues.map(queue => <button className="queue-card" key={queue.id} onClick={() => nav(`/queues/${queue.id}`)}>
            <div className="queue-icon"><Ticket size={19} /></div>
            <div className="queue-info"><b>{queue.name}</b><small>{queue.waitingCount} people waiting</small></div>
            <span className="queue-open"><ArrowUpRight size={16} /></span>
          </button>)}</div> : <div className="empty"><div className="empty-icon"><Ticket /></div><b>No queues yet</b><p>Create your first queue to start managing tokens.</p><button className="primary" onClick={() => setShow(true)}><Plus size={16} />Create your first queue</button></div>}
        </section>
      </> : !err && <div className="loading-panel"><span className="loader" />Loading your workspace…</div>}

      {show && <Modal title="Create a queue" close={() => setShow(false)}><form onSubmit={create}><label>Queue name</label><input autoFocus placeholder="e.g. General consultation" value={name} onChange={event => setName(event.target.value)} required maxLength={60} />{err && <div className="error">{err}</div>}<button className="primary full" disabled={creating}>{creating ? 'Creating…' : 'Create queue'}</button></form></Modal>}
    </Shell>
  );
}
