import React from 'react'
import { Ticket } from '../type'

interface TicketComponentProps {
    ticket: Ticket;
    index?: number;
    totalWaitTime?: number;
}

const TicketComponent : React.FC<TicketComponentProps> = ({ticket, index, totalWaitTime = 0}) => {
  return (
    <div>
      Test
    </div>
  )
}

export default TicketComponent
