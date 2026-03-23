import { Ticket as TicketCompany } from "../app/generated/prisma/client";

export type Ticket = TicketCompany & {
    serviceName : string ;
    avgTime : number ;
    estimatedWait? : number ;
    confidence? : 'none' | 'low' | 'medium' | 'high'
    clientDistance? : string ;
}