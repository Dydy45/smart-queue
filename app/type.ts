import { Ticket as TicketCompany } from "./generated/prisma";

export type Ticket = TicketCompany & {
    serviceName : string ;
    avgTime : number ;
    estimatedWait? : number ;
    confidence? : 'none' | 'low' | 'medium' | 'high'
    clientDistance? : string ;
}