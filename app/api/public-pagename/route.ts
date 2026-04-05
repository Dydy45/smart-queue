import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const company = await prisma.company.findFirst({
            select: { pageName: true },
            where: { pageName: { not: null } },
        })
        return NextResponse.json({ pageName: company?.pageName ?? null })
    } catch {
        return NextResponse.json({ pageName: null })
    }
}
