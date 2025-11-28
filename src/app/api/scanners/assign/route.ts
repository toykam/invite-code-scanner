import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Assign scanner to events
export const POST = async (req: Request) => {
    try {
        const { scannerId, eventSlugs } = await req.json();

        if (!scannerId || !eventSlugs || !Array.isArray(eventSlugs)) {
            return NextResponse.json({
                message: "scannerId and eventSlugs array are required"
            }, { status: 400 });
        }

        // Check if scanner exists
        const scanner = await prisma.scanner.findUnique({
            where: { id: scannerId }
        });

        if (!scanner) {
            return NextResponse.json({
                message: "Scanner not found"
            }, { status: 404 });
        }

        // Find events
        const events = await prisma.event.findMany({
            where: { slug: { in: eventSlugs } }
        });

        if (events.length === 0) {
            return NextResponse.json({
                message: "No valid events found"
            }, { status: 404 });
        }

        // Create assignments (ignore duplicates)
        const assignments = await Promise.all(
            events.map(async (event: { id: string; slug: string }) => {
                return prisma.scannerAssignment.upsert({
                    where: {
                        scannerId_eventId: {
                            scannerId: scanner.id,
                            eventId: event.id
                        }
                    },
                    create: {
                        scannerId: scanner.id,
                        eventId: event.id
                    },
                    update: {}
                });
            })
        );

        return NextResponse.json({
            message: "Scanner assigned to events successfully",
            assignments
        }, { status: 200 });

    } catch (error) {
        console.log("Error assigning scanner:", error);
        return NextResponse.json({
            message: "Failed to assign scanner"
        }, { status: 500 });
    }
};

// Remove scanner from events
export const DELETE = async (req: Request) => {
    try {
        const { scannerId, eventSlugs } = await req.json();

        if (!scannerId || !eventSlugs || !Array.isArray(eventSlugs)) {
            return NextResponse.json({
                message: "scannerId and eventSlugs array are required"
            }, { status: 400 });
        }

        // Find events
        const events = await prisma.event.findMany({
            where: { slug: { in: eventSlugs } }
        });

        if (events.length === 0) {
            return NextResponse.json({
                message: "No valid events found"
            }, { status: 404 });
        }

        // Delete assignments
        await prisma.scannerAssignment.deleteMany({
            where: {
                scannerId,
                eventId: { in: events.map((e: { id: string }) => e.id) }
            }
        });

        return NextResponse.json({
            message: "Scanner unassigned from events successfully"
        }, { status: 200 });

    } catch (error) {
        console.log("Error unassigning scanner:", error);
        return NextResponse.json({
            message: "Failed to unassign scanner"
        }, { status: 500 });
    }
};
