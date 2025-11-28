import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server"


export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const eventSlug = searchParams.get('eventSlug');

        if (!eventSlug) {
            return NextResponse.json({
                'message': "Event slug is required"
            }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { slug: eventSlug }
        });

        if (!event) {
            return NextResponse.json({
                'message': "Event not found"
            }, { status: 404 });
        }

        const totalScanned = await prisma.invite.count({
            where: { eventId: event.id }
        });

        return NextResponse.json({
            'message': 'Total Scanned Fetched Successfully',
            'totalScanned': totalScanned,
            'eventName': event.name
        }, { status: 200 });

    } catch (error) {
        console.log("Error getting total scanned invites:", error)
        return NextResponse.json({
            'message': "Something went wrong"
        }, { status: 500 })
    }
}