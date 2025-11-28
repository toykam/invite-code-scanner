import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = {
    params: Promise<{ slug: string }>;
};

// GET event statistics
export const GET = async (req: Request, { params }: RouteParams) => {
    try {
        const { slug } = await params;

        const event = await prisma.event.findUnique({
            where: { slug }
        });

        if (!event) {
            return NextResponse.json({
                message: "Event not found"
            }, { status: 404 });
        }

        const [totalScanned, recentScans] = await Promise.all([
            prisma.invite.count({
                where: { eventId: event.id }
            }),
            prisma.invite.findMany({
                where: { eventId: event.id },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    inviteQrCode: true,
                    createdAt: true
                }
            })
        ]);

        // Get scans grouped by hour for the last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const scansByHour = await prisma.$queryRaw<Array<{ hour: Date; count: bigint }>>`
            SELECT 
                DATE_TRUNC('hour', "createdAt") as hour,
                COUNT(*)::int as count
            FROM "Invite"
            WHERE "eventId" = ${event.id}
            AND "createdAt" >= ${last24Hours}
            GROUP BY DATE_TRUNC('hour', "createdAt")
            ORDER BY hour DESC
        `;

        return NextResponse.json({
            message: 'Event statistics fetched successfully',
            stats: {
                totalScanned,
                recentScans,
                scansByHour: scansByHour.map((row: any) => ({
                    hour: row.hour,
                    count: Number(row.count)
                }))
            }
        }, { status: 200 });

    } catch (error) {
        console.log("Error fetching event statistics:", error);
        return NextResponse.json({
            message: "Failed to fetch event statistics"
        }, { status: 500 });
    }
};
