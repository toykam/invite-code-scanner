import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
    try {
        const { phoneNumber, pin, eventSlug } = await req.json();

        if (!phoneNumber || !pin || !eventSlug) {
            return NextResponse.json({
                message: "Phone number, PIN, and event slug are required"
            }, { status: 400 });
        }

        const event = await prisma.event.findUnique({
            where: { slug: eventSlug, isActive: true }
        });

        if (!event) {
            return NextResponse.json({
                message: "Event not found or inactive"
            }, { status: 404 });
        }

        const scanner = await prisma.scanner.findFirst({
            where: {
                phoneNumber,
                isActive: true
            },
            include: {
                eventAssignments: {
                    where: {
                        eventId: event.id
                    }
                }
            }
        });

        if (!scanner) {
            return NextResponse.json({
                message: "Invalid credentials"
            }, { status: 401 });
        }

        // Check if scanner is assigned to this event
        if (scanner.eventAssignments.length === 0) {
            return NextResponse.json({
                message: "You are not assigned to this event"
            }, { status: 403 });
        }

        // Simple PIN verification
        if (scanner.pin !== pin) {
            return NextResponse.json({
                message: "Invalid credentials"
            }, { status: 401 });
        }

        return NextResponse.json({
            message: 'Login successful',
            scanner: {
                id: scanner.id,
                name: scanner.name,
                email: scanner.email,
                phoneNumber: scanner.phoneNumber,
                eventId: event.id
            }
        }, { status: 200 });

    } catch (error) {
        console.log("Error logging in scanner:", error);
        return NextResponse.json({
            message: "Something went wrong"
        }, { status: 500 });
    }
};
