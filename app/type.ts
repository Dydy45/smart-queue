import { Ticket as TicketCompany } from "../app/generated/prisma/client";

export type Ticket = TicketCompany & {
    serviceName : string ;
    avgTime : number
}