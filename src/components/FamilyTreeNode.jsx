import { Handle, Position } from 'reactflow'
import { iconeRang } from '../lib/rankUtils'

function FamilyTreeNode({ data }) {
  const { name, avatarUrl, dead, rank, isSelf } = data

  return (
    <div className={`noeud-arbre ${isSelf ? 'noeud-arbre-actif' : ''} ${dead ? 'noeud-arbre-mort' : ''}`}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />

      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="noeud-arbre-avatar" />
      ) : (
        <div className="noeud-arbre-avatar noeud-arbre-avatar-vide">{name.charAt(0)}</div>
      )}
      <span className="noeud-arbre-nom">
        {iconeRang(rank) && <span>{iconeRang(rank)} </span>}
        {name}
      </span>
      {dead && <span className="noeud-arbre-croix">🥀</span>}
    </div>
  )
}

export default FamilyTreeNode
