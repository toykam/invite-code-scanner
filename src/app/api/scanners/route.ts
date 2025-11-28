import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all scanners (optionally filtered by event)
export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const eventSlug = searchParams.get('eventSlug');

        let scanners;

        if (eventSlug) {
            // Get scanners assigned to a specific event
            const event = await prisma.event.findUnique({
                where: { slug: eventSlug },
                include: {
                    scannerAssignments: {
                        include: {
                            scanner: {
                                include: {
                                    _count: {
                                        select: { invites: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!event) {
                return NextResponse.json({
                    message: "Event not found"
                }, { status: 404 });
            }

            scanners = event.scannerAssignments.map((assignment: any) => ({
                ...assignment.scanner,
                assignedAt: assignment.assignedAt
            }));
        } else {
            // Get all scanners
            scanners = await prisma.scanner.findMany({
                include: {
                    _count: {
                        select: { 
                            invites: true,
                            eventAssignments: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        return NextResponse.json({
            message: 'Scanners fetched successfully',
            scanners
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching scanners:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            message: "Failed to fetch scanners",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined
        }, { status: 500 });
    }
};

// POST create new scanner
export const POST = async (req: Request) => {
    try {
        const { name, email, phoneNumber, pin, eventSlugs } = await req.json();

        if (!name || !pin) {
            return NextResponse.json({
                message: "Missing required fields: name, pin"
            }, { status: 400 });
        }

        if (!phoneNumber && !email) {
            return NextResponse.json({
                message: "Either phone number or email is required"
            }, { status: 400 });
        }

        // Check if scanner with same phone already exists
        if (phoneNumber) {
            const existingScanner = await prisma.scanner.findUnique({
                where: { phoneNumber }
            });

            if (existingScanner) {
                return NextResponse.json({
                    message: "Scanner with this phone number already exists"
                }, { status: 400 });
            }
        }

        // Create scanner
        const scanner = await prisma.scanner.create({
            data: {
                name,
                email,
                phoneNumber,
                pin
            }
        });

        // Assign to events if provided
        if (eventSlugs && Array.isArray(eventSlugs) && eventSlugs.length > 0) {
            const events = await prisma.event.findMany({
                where: { slug: { in: eventSlugs } }
            });

            if (events.length > 0) {
                await prisma.scannerAssignment.createMany({
                    data: events.map((event: { id: string; slug: string }) => ({
                        scannerId: scanner.id,
                        eventId: event.id
                    }))
                });
            }
        }

        return NextResponse.json({
            message: 'Scanner created successfully',
            scanner: {
                id: scanner.id,
                name: scanner.name,
                email: scanner.email,
                phoneNumber: scanner.phoneNumber
            }
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating scanner:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            message: "Failed to create scanner",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined
        }, { status: 500 });
    }
};
