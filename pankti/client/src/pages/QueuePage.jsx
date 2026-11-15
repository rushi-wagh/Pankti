import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, Check, Clock3, Play, Plus, Users, X } from 'lucide-react';
import { api, API } from '../lib/api';
import Shell from '../components/Shell';

const tokenLabel = number => `#${String(number).padStart(3, '0')}`;

export default function QueuePage() {
  const { id } = useParams();
  const [queue, setQueue] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [servingNext, setServingNext] = useState(false);
  const [busyToken, setBusyToken] = useState('');
  const [draggedTokenId, setDraggedTokenId] = useState('');
  const [dragOverTokenId, setDragOverTokenId] = useState('');
  const nav = useNavigate();

  async function load() {
    try {
      const [queueList, tokenList] = await Promise.all([api.get('/queues'), api.get(`/queues/${id}/tokens`)]);
      setQueue(queueList.data.find(item => item.id === id));
      setTokens(tokenList.data);
      setError('');
    } catch {
      setError('Could not load this queue. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const socket = io(API);
    socket.emit('queue:join', id);
    socket.on('queue:update', load);
    return () => socket.disconnect();
  }, [id]);

  async function add(event) {
    event.preventDefault();
    setAdding(true);
    try {
      await api.post(`/queues/${id}/tokens`, { name });
      setName('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add token');
    } finally {
      setAdding(false);
    }
  }

  async function act(token, action) {
    setBusyToken(token.id);
    try {
      await api.patch(`/queues/${id}/tokens/${token.id}`, { action });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setBusyToken('');
    }
  }

  async function moveToken(token, direction) {
    if (busyToken || token.status !== 'WAITING') return;
    setBusyToken(token.id);
    try {
      await api.patch(`/queues/${id}/tokens/${token.id}`, { action: direction });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reorder token');
    } finally {
      setBusyToken('');
    }
  }

  async function dropToken(targetToken) {
    if (!draggedTokenId || draggedTokenId === targetToken.id || busyToken) return;
    const sourceIndex = waiting.findIndex(token => token.id === draggedTokenId);
    const targetIndex = waiting.findIndex(token => token.id === targetToken.id);
    const sourceToken = waiting[sourceIndex];
    if (!sourceToken || targetIndex < 0) return;

    const direction = sourceIndex < targetIndex ? 'down' : 'up';
    const steps = Math.abs(sourceIndex - targetIndex);
    setBusyToken(sourceToken.id);
    try {
      for (let step = 0; step < steps; step += 1) {
        await api.patch(`/queues/${id}/tokens/${sourceToken.id}`, { action: direction });
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reorder token');
    } finally {
      setBusyToken('');
      setDraggedTokenId('');
      setDragOverTokenId('');
    }
  }

  async function serve() {
    setServingNext(true);
    try {
      await api.post(`/queues/${id}/serve`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not call the next token');
    } finally {
      setServingNext(false);
    }
  }

  if (loading) return <Shell><div className="loading-panel"><span className="loader" />Loading queue…</div></Shell>;
  if (!queue) return <Shell><button className="back" onClick={() => nav('/')}><ArrowLeft size={15} />Back to overview</button><div className="panel"><h2>Queue not found</h2><p className="muted">This queue may have been deleted or you may not have access to it.</p></div></Shell>;

  const waiting = tokens.filter(token => token.status === 'WAITING');
  const serving = tokens.filter(token => token.status === 'SERVING');
  const completed = tokens.filter(token => token.status === 'COMPLETED');
  const history = tokens.filter(token => ['COMPLETED', 'CANCELLED'].includes(token.status)).slice(0, 8);
  const current = serving[0];

  return (
    <Shell>
      <header className="topbar queue-topbar">
        <div>
          <button className="back" onClick={() => nav('/')}><ArrowLeft size={15} />All queues</button>
          <p className="eyebrow">QUEUE OPERATIONS</p>
          <h1>{queue.name}<span className="heading-period">.</span></h1>
          <p className="muted">Manage the waiting line and serve people in order.</p>
        </div>
        <button className="primary" disabled={!waiting.length || Boolean(current) || servingNext} onClick={serve}><Play size={16} fill="currentColor" />{servingNext ? 'Calling…' : 'Call next'}</button>
      </header>

      {error && <div className="error banner">{error}<button onClick={() => setError('')}>Dismiss</button></div>}

      <section className="queue-metrics">
        <div className="metric"><small>Waiting</small><b>{waiting.length}</b></div>
        <div className="metric"><small>In service</small><b>{serving.length}</b></div>
        <div className="metric"><small>Completed</small><b>{completed.length}</b></div>
      </section>

      <section className="panel serving-panel">
        <div className="panel-head"><div><h2>Currently serving</h2><p className="muted">The person being attended to right now</p></div><span className="live-indicator"><span />LIVE QUEUE</span></div>
        {current ? <div className="serving-card serving-feature">
          <div className="serving-main"><span className="status serving">IN SERVICE</span><h2>{tokenLabel(current.number)}</h2><b>{current.name}</b><p>Called at {current.calledAt ? new Date(current.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}</p></div>
          <button className="success-btn" onClick={() => act(current, 'complete')} disabled={busyToken === current.id}><Check size={17} />{busyToken === current.id ? 'Updating…' : 'Mark as completed'}</button>
        </div> : <div className="serving-empty"><div className="empty-icon"><Clock3 /></div><div><b>No one is being served</b><p>Call the next person when the counter is ready.</p></div><button className="primary" disabled={!waiting.length || servingNext} onClick={serve}><Play size={15} fill="currentColor" />{servingNext ? 'Calling…' : 'Call next token'}</button></div>}
      </section>

      <div className="manage-grid queue-workspace">
        <section className="panel waiting-panel">
          <div className="panel-head"><div><h2>Waiting list <span className="count">{waiting.length}</span></h2><p className="muted">Reorder the line or cancel a token.</p></div></div>
          <form className="add-form" onSubmit={add}><input placeholder="Enter person's name" value={name} onChange={event => setName(event.target.value)} required maxLength={80} /><button className="primary" disabled={adding || !name.trim()}><Plus size={16} />{adding ? 'Adding…' : 'Add customer'}</button></form>
          {waiting.length ? <div className="token-list">{waiting.map(token => <div
            className={`token-row ${draggedTokenId === token.id ? 'dragging' : ''} ${dragOverTokenId === token.id ? 'drag-over' : ''}`}
            key={token.id}
            draggable
            tabIndex="0"
            aria-label={`Reorder ${token.name}`}
            onDragStart={event => {
              event.dataTransfer.setData('text/plain', token.id);
              event.dataTransfer.effectAllowed = 'move';
              setDraggedTokenId(token.id);
            }}
            onDragEnd={() => {
              setDraggedTokenId('');
              setDragOverTokenId('');
            }}
            onDragOver={event => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
              if (draggedTokenId !== token.id) setDragOverTokenId(token.id);
            }}
            onDrop={event => {
              event.preventDefault();
              dropToken(token);
            }}
            onKeyDown={event => {
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
                moveToken(token, event.key === 'ArrowUp' ? 'up' : 'down');
              }
            }}
          >
            <span className="token-number">{tokenLabel(token.number)}</span>
            <div className="token-person"><b>{token.name}</b><small>Added {new Date(token.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>
            <span className="status waiting">Waiting</span>
            <div className="actions"><button className="icon-btn danger" title="Cancel token" disabled={busyToken === token.id} onClick={() => act(token, 'cancel')}><X size={16} /></button></div>
          </div>)}</div> : <div className="empty compact"><div className="empty-icon"><Users /></div><b>Queue is clear</b><p>No one is waiting right now. Add a customer to get started.</p></div>}
        </section>

        <section className="panel activity-panel">
          <div className="panel-head"><div><h2>Recent activity</h2><p className="muted">Latest completed and cancelled tokens</p></div></div>
          {history.length ? history.map(token => <div className="history-row" key={token.id}><span className="history-person"><b>{tokenLabel(token.number)}</b>{token.name}</span><span className={`status ${token.status.toLowerCase()}`}>{token.status.toLowerCase()}</span></div>) : <div className="empty compact"><div className="empty-icon"><Clock3 /></div><b>No activity yet</b><p>Completed and cancelled tokens will appear here.</p></div>}
        </section>
      </div>
    </Shell>
  );
}
