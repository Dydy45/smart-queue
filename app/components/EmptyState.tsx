import { icons } from 'lucide-react'
import React, { FC } from 'react'

interface EmptyStateProps {
    IconComponent : keyof typeof icons
    message : string
    sm? : boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EmptyState : FC<EmptyStateProps> = ({IconComponent, message, sm}) => {
    const SelectedIcon = icons[IconComponent]
  return (
    <div>
      <div>
        <SelectedIcon />
      </div>
      <p>{message}</p>
    </div>
  )
}

export default EmptyState
