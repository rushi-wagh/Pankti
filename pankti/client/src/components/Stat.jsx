export default function Stat({icon,label,value,tone}){return <div className="stat"><div className={'stat-icon '+tone}>{icon}</div><div><small>{label}</small><strong>{value}</strong></div></div>}
