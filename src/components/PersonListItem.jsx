import { Link } from 'react-router-dom'
import { iconeRang } from '../lib/rankUtils'

function PersonListItem({ person, extra }) {
  return (
    <Link to={`/personnage/${person.id}`} className={person.dead ? 'person-name-dead' : ''}>
      <div className="ligne-personne">
        {person.avatar_url ? (
          <img src={person.avatar_url} alt="" className="avatar" />
        ) : (
          <div className="avatar-placeholder">{person.name.charAt(0)}</div>
        )}
        <span>
          {iconeRang(person.rank) && <span title={person.rank}>{iconeRang(person.rank)} </span>}
          {person.name}
          {person.dead && <span className="badge-mort">mort</span>}
          {extra && <span className="meta-extra"> — {extra}</span>}
        </span>
      </div>
    </Link>
  )
}

export default PersonListItem