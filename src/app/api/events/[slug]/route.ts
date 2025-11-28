import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = {
    params: Promise<{ slug: string }>;
};

// GET single event by slug
export const GET = async (req: Request, { params }: RouteParams) => {
    try {
        const { slug } = await params;

        const event = await prisma.event.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: { invites: true }
                }
            }
        });

        if (!event) {
            return NextResponse.json({
                message: "Event not found"
            }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Event fetched successfully',
            event
        }, { status: 200 });

    } catch (error) {
        console.log("Error fetching event:", error);
        return NextResponse.json({
            message: "Failed to fetch event"
        }, { status: 500 });
    }
};

// PATCH update event
export const PATCH = async (req: Request, { params }: RouteParams) => {
    try {
        const { slug } = await params;
        const updateData = await req.json();

        // Don't allow changing the slug through PATCH
        delete updateData.id;
        delete updateData.slug;
        delete updateData.createdAt;

        // Validate regex patterns if provided
        if (updateData.attendantCodePattern) {
            try {
                new RegExp(updateData.attendantCodePattern);
            } catch {
                return NextResponse.json({
                    message: "Invalid attendant code pattern"
                }, { status: 400 });
            }
        }

        if (updateData.driverCodePattern) {
            try {
                new RegExp(updateData.driverCodePattern);
            } catch {
                return NextResponse.json({
                    message: "Invalid driver code pattern"
                }, { status: 400 });
            }
        }

        // Convert date strings to Date objects
        if (updateData.startDate) {
            updateData.startDate = new Date(updateData.startDate);
        }
        if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
        }

        const event = await prisma.event.update({
            where: { slug },
            data: updateData
        });

        return NextResponse.json({
            message: 'Event updated successfully',
            event
        }, { status: 200 });

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({
                message: "Event not found"
            }, { status: 404 });
        }
        console.log("Error updating event:", error);
        return NextResponse.json({
            message: "Failed to update event"
        }, { status: 500 });
    }
};

// DELETE event (soft or hard delete)
export const DELETE = async (req: Request, { params }: RouteParams) => {
    try {
        const { slug } = await params;
        const url = new URL(req.url);
        const permanent = url.searchParams.get("permanent") === "true";

        if (permanent) {
            // Hard delete: Check if event has any scans first
            const scanCount = await prisma.invite.count({
                where: { eventId: (await prisma.event.findUnique({ where: { slug }, select: { id: true } }))?.id }
            });

            if (scanCount > 0) {
                return NextResponse.json({
                    message: `Cannot delete event with ${scanCount} scans recorded. Deactivate instead.`
                }, { status: 400 });
            }

            // Delete assignments first (cascade), then event
            const event = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
            if (!event) {
                return NextResponse.json({
                    message: "Event not found"
                }, { status: 404 });
            }

            await prisma.$transaction([
                prisma.scannerAssignment.deleteMany({
                    where: { eventId: event.id }
                }),
                prisma.event.delete({
                    where: { slug }
                })
            ]);

            return NextResponse.json({
                message: 'Event permanently deleted'
            }, { status: 200 });
        } else {
            // Soft delete: Set isActive to false
            const event = await prisma.event.update({
                where: { slug },
                data: { isActive: false }
            });

            return NextResponse.json({
                message: 'Event deactivated successfully',
                event
            }, { status: 200 });
        }

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({
                message: "Event not found"
            }, { status: 404 });
        }
        console.log("Error deleting event:", error);
        return NextResponse.json({
            message: "Failed to delete event"
        }, { status: 500 });
    }
};
