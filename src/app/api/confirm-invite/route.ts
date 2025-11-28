import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server"


export const POST = async (req: Request) => {
    try {
        const { inviteCode, eventSlug, scannerId } = await req.json();

        if (!eventSlug) {
            return NextResponse.json({
                'message': "Event slug is required"
            }, { status: 400 });
        }

        if (!scannerId) {
            return NextResponse.json({
                'message': "Scanner ID is required"
            }, { status: 400 });
        }

        // Get the event
        const event = await prisma.event.findUnique({
            where: { slug: eventSlug, isActive: true }
        });

        if (!event) {
            return NextResponse.json({
                'message': "Event not found or inactive"
            }, { status: 404 });
        }

        // Verify scanner is assigned to this event
        const scannerAssignment = await prisma.scannerAssignment.findUnique({
            where: {
                scannerId_eventId: {
                    scannerId: scannerId,
                    eventId: event.id
                }
            },
            include: {
                scanner: true
            }
        });

        if (!scannerAssignment || !scannerAssignment.scanner.isActive) {
            return NextResponse.json({
                'message': "Invalid scanner or scanner not authorized for this event"
            }, { status: 403 });
        }

        // Validate invite code against event patterns
        const attendantPattern = new RegExp(event.attendantCodePattern);
        const driverPattern = event.driverCodePattern ? new RegExp(event.driverCodePattern) : null;

        const isValid = attendantPattern.test(inviteCode) || 
                       (driverPattern && driverPattern.test(inviteCode));

        if (!isValid) {
            return NextResponse.json({
                'message': "Invalid invite code format for this event"
            }, { status: 400 });
        }

        // Use transaction to prevent race conditions
        try {
            const result = await prisma.$transaction(async (tx: any) => {
                // Check if code already used for this event
                const existingInvite = await tx.invite.findFirst({
                    where: {
                        inviteQrCode: inviteCode,
                        eventId: event.id
                    }
                });

                if (existingInvite) {
                    throw new Error("ALREADY_USED");
                }

                // Create the invite
                const newInvite = await tx.invite.create({
                    data: {
                        inviteQrCode: inviteCode,
                        eventId: event.id,
                        scannerId: scannerId
                    }
                });

                // Get total scanned for this event
                const totalScanned = await tx.invite.count({
                    where: { eventId: event.id }
                });

                return { newInvite, totalScanned };
            });

            return NextResponse.json({
                'message': `Welcome to ${event.name}`,
                'totalScanned': result.totalScanned,
                'eventName': event.name
            }, { status: 200 });

        } catch (txError: any) {
            if (txError.message === "ALREADY_USED") {
                return NextResponse.json({
                    'message': "Invite code already used for this event"
                }, { status: 400 });
            }
            throw txError;
        }

    } catch (error) {
        console.log("Error confirming invite:", error)
        return NextResponse.json({
            'message': "Something went wrong"
        }, { status: 500 })
    }
}