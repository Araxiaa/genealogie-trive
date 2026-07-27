import { useMemo } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import { useNavigate } from 'react-router-dom'
import FamilyTreeNode from './FamilyTreeNode'
import 'reactflow/dist/style.css'

const ROW_GAP = 170
const COL_GAP = 190

const nodeTypes = { personCard: FamilyTreeNode }

function layoutRow(count, startX = 400) {
  const totalWidth = (count - 1) * COL_GAP
  const firstX = startX - totalWidth / 2
  return Array.from({ length: count }, (_, i) => firstX + i * COL_GAP)
}

function makeNodeAvecAvatar(id, name, dead, rank, avatarUrl, x, y, isSelf = false) {
  return {
    id,
    type: 'personCard',
    position: { x, y },
    data: { name, avatarUrl, dead, rank, isSelf },
    draggable: false,
  }
}

function FamilyTree({ person, parents, grandparents, siblings, partners, children, grandchildren }) {
  const navigate = useNavigate()

  const { nodes, edges } = useMemo(() => {
    const nodes = []
    const edges = []

    const gpXs = layoutRow(grandparents.length)
    grandparents.forEach((gp, i) => {
      nodes.push(makeNodeAvecAvatar(gp.persons.id, gp.persons.name, gp.persons.dead, gp.persons.rank, gp.persons.avatar_url, gpXs[i], 0))
      edges.push({
        id: `gp-${gp.persons.id}-${gp.child_id}`,
        source: gp.persons.id,
        sourceHandle: 'bottom',
        target: gp.child_id,
        targetHandle: 'top',
        type: 'default',
        style: { stroke: 'var(--couleur-texte-discret)', strokeWidth: 1.5, opacity: 0.7 },
      })
    })

    const parentXs = layoutRow(parents.length)
    parents.forEach((p, i) => {
      nodes.push(makeNodeAvecAvatar(p.id, p.name, p.dead, p.rank, p.avatar_url, parentXs[i], ROW_GAP))
      edges.push({
        id: `p-${p.id}-${person.id}`,
        source: p.id,
        sourceHandle: 'bottom',
        target: person.id,
        targetHandle: 'top',
        type: 'default',
        style: { stroke: 'var(--couleur-accent)', strokeWidth: 2 },
      })
    })

    const mainItems = [
      ...siblings.map((s) => ({ ...s.persons, kind: 'sibling', parentIds: s.parentIds })),
      { ...person, kind: 'self' },
      ...partners.map((pa) => ({ ...pa, kind: 'partner' })),
    ]
    const mainXs = layoutRow(mainItems.length)
    let dernierIdAGauche = null

    mainItems.forEach((item, i) => {
      const isSelf = item.kind === 'self'
      nodes.push(makeNodeAvecAvatar(item.id, item.name, item.dead, item.rank, item.avatar_url, mainXs[i], ROW_GAP * 2, isSelf))

      if (item.kind === 'sibling') {
        item.parentIds.forEach((parentId) => {
          edges.push({
            id: `sib-${parentId}-${item.id}`,
            source: parentId,
            sourceHandle: 'bottom',
            target: item.id,
            targetHandle: 'top',
            type: 'default',
            style: { stroke: 'var(--couleur-texte-discret)', strokeWidth: 1.5, opacity: 0.7 },
          })
        })
      }

      if (isSelf) dernierIdAGauche = item.id

      if (item.kind === 'partner') {
        edges.push({
          id: `union-${dernierIdAGauche}-${item.id}`,
          source: dernierIdAGauche,
          sourceHandle: 'right',
          target: item.id,
          targetHandle: 'left',
          type: 'default',
          style: { stroke: 'var(--couleur-accent)', strokeWidth: 2, strokeDasharray: '5 4' },
          label: '♥',
          labelStyle: { fill: 'var(--couleur-accent)', fontSize: 14 },
          labelBgStyle: { fill: 'var(--couleur-fond-carte)' },
        })
      }
    })

    const childXs = layoutRow(children.length)
    children.forEach((c, i) => {
      nodes.push(makeNodeAvecAvatar(c.id, c.name, c.dead, c.rank, c.avatar_url, childXs[i], ROW_GAP * 3))
      edges.push({
        id: `c-${person.id}-${c.id}`,
        source: person.id,
        sourceHandle: 'bottom',
        target: c.id,
        targetHandle: 'top',
        type: 'default',
        style: { stroke: 'var(--couleur-accent)', strokeWidth: 2 },
      })
    })

    const gcXs = layoutRow(grandchildren.length)
    grandchildren.forEach((gc, i) => {
      nodes.push(makeNodeAvecAvatar(gc.persons.id, gc.persons.name, gc.persons.dead, gc.persons.rank, gc.persons.avatar_url, gcXs[i], ROW_GAP * 4))
      edges.push({
        id: `gc-${gc.parent_id}-${gc.persons.id}`,
        source: gc.parent_id,
        sourceHandle: 'bottom',
        target: gc.persons.id,
        targetHandle: 'top',
        type: 'default',
        style: { stroke: 'var(--couleur-texte-discret)', strokeWidth: 1.5, opacity: 0.7 },
      })
    })

    return { nodes, edges }
  }, [person, parents, grandparents, siblings, partners, children, grandchildren])

  function onNodeClick(_, node) {
    if (node.id !== person.id) {
      navigate(`/personnage/${node.id}`)
    }
  }

  return (
    <div className="conteneur-arbre">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="var(--couleur-bordure)" gap={22} size={1.5} variant="dots" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}

export default FamilyTree
