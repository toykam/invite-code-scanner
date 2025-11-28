import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all events
export const GET = async (req: Request) => {
    try {
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';

        const events = await prisma.event.findMany({
            where: activeOnly ? { isActive: true } : {},
            include: {
                _count: {
                    select: { invites: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            message: 'Events fetched successfully',
            events
        }, { status: 200 });

    } catch (error) {
        console.log("Error fetching events:", error);
        return NextResponse.json({
            message: "Failed to fetch events"
        }, { status: 500 });
    }
};

// POST create new event
export const POST = async (req: Request) => {
    try {
        const { 
            name, 
            slug, 
            description, 
            codePrefix,
            attendantCodePattern,
            driverCodePattern,
            startDate,
            endDate 
        } = await req.json();

        // Validate required fields
        if (!name || !slug || !codePrefix || !attendantCodePattern) {
            return NextResponse.json({
                message: "Missing required fields: name, slug, codePrefix, attendantCodePattern"
            }, { status: 400 });
        }

        // Check if slug already exists
        const existingEvent = await prisma.event.findUnique({
            where: { slug }
        });

        if (existingEvent) {
            return NextResponse.json({
                message: "Event with this slug already exists"
            }, { status: 400 });
        }

        // Validate regex patterns
        try {
            new RegExp(attendantCodePattern);
            if (driverCodePattern) {
                new RegExp(driverCodePattern);
            }
        } catch (regexError) {
            return NextResponse.json({
                message: "Invalid regex pattern provided"
            }, { status: 400 });
        }

        const event = await prisma.event.create({
            data: {
                name,
                slug,
                description,
                codePrefix,
                attendantCodePattern,
                driverCodePattern,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isActive: true
            }
        });

        return NextResponse.json({
            message: 'Event created successfully',
            event
        }, { status: 201 });

    } catch (error) {
        console.log("Error creating event:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({
            message: "Failed to create event",
            error: process.env.NODE_ENV === "development" ? errorMessage : undefined
        }, { status: 500 });
    }
};
