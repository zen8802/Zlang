'use client'

import { motion } from 'framer-motion'

interface SkillTreeProps {
  skillLevels: Record<string, number>
}

const SKILL_NODES = [
  { key: 'pronunciation', kanji: '口', angle: 270 }, // top
  { key: 'vocabulary', kanji: '言', angle: 330 },    // top-right
  { key: 'grammar', kanji: '文', angle: 30 },        // bottom-right
  { key: 'culture', kanji: '文化', angle: 90 },      // bottom
  { key: 'listening', kanji: '耳', angle: 150 },     // bottom-left
  { key: 'speaking', kanji: '話', angle: 210 },      // top-left
]

// Lines connecting adjacent nodes
const CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 0],
]

const CX = 150
const CY = 150
const RADIUS = 100
const NODE_R = 32

function getNodePos(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: CX + RADIUS * Math.cos(rad),
    y: CY + RADIUS * Math.sin(rad),
  }
}

export default function SkillTree({ skillLevels }: SkillTreeProps) {
  const nodePositions = SKILL_NODES.map((n) => getNodePos(n.angle))

  return (
    <div className="flex justify-center">
      <svg
        viewBox="0 0 300 300"
        className="w-full max-w-[280px]"
        role="img"
        aria-label="Skill tree showing six language skills"
      >
        {/* Connection lines */}
        {CONNECTIONS.map(([a, b], i) => {
          const pa = nodePositions[a]
          const pb = nodePositions[b]
          const levelA = skillLevels[SKILL_NODES[a].key] ?? 0
          const levelB = skillLevels[SKILL_NODES[b].key] ?? 0
          const avgLevel = (levelA + levelB) / 2
          const lineOpacity = 0.08 + (avgLevel / 5) * 0.3

          return (
            <motion.line
              key={`line-${i}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="#00FFB2"
              strokeWidth={1.5}
              initial={{ opacity: 0 }}
              animate={{ opacity: lineOpacity }}
              transition={{ duration: 0.6, delay: 0.8 + i * 0.05 }}
            />
          )
        })}

        {/* Skill nodes */}
        {SKILL_NODES.map((node, i) => {
          const pos = nodePositions[i]
          const level = skillLevels[node.key] ?? 0
          // Opacity scales from 0.12 (level 0) to 1.0 (level 5)
          const fillOpacity = 0.12 + (level / 5) * 0.88
          const hasGlow = level > 0

          return (
            <motion.g
              key={node.key}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + i * 0.1,
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              {/* Glow filter for active nodes */}
              {hasGlow && (
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_R + 6}
                  fill="none"
                  stroke="#00FFB2"
                  strokeWidth={2}
                  animate={{
                    opacity: [0.15, 0.4, 0.15],
                    r: [NODE_R + 4, NODE_R + 8, NODE_R + 4],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3,
                  }}
                />
              )}

              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_R}
                fill={`rgba(0, 255, 178, ${fillOpacity})`}
                stroke="rgba(0, 255, 178, 0.3)"
                strokeWidth={1.5}
              />

              {/* Kanji label */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={node.kanji.length > 1 ? 13 : 16}
                fontWeight="600"
                className="font-jp select-none"
                style={{ opacity: 0.6 + (level / 5) * 0.4 }}
              >
                {node.kanji}
              </text>

              {/* Level indicator below node */}
              <text
                x={pos.x}
                y={pos.y + NODE_R + 14}
                textAnchor="middle"
                fill="rgba(255,255,255,0.4)"
                fontSize={10}
                className="select-none"
              >
                Lv.{level}
              </text>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}
