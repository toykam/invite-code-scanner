import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteParams = {
    params: Promise<{ id: string }>;
};

// DELETE scanner with cascade handling
export const DELETE = async (req: Request, { params }: RouteParams) => {
    try {
        const { id } = await params;
        const url = new URL(req.url);
        const permanent = url.searchParams.get("permanent") === "true";

        if (permanent) {
            // Hard delete: Check if scanner has any scans first
            const scanCount = await prisma.invite.count({
                where: { scannerId: id }
            });

            if (scanCount > 0) {
                return NextResponse.json({
                    message: `Cannot delete scanner with ${scanCount} scans recorded. Deactivate instead.`
                }, { status: 400 });
            }

            // Delete assignments first (cascade), then scanner
            await prisma.$transaction([
                prisma.scannerAssignment.deleteMany({
                    where: { scannerId: id }
                }),
                prisma.scanner.delete({
                    where: { id }
                })
            ]);

            return NextResponse.json({
                message: 'Scanner permanently deleted'
            }, { status: 200 });
        } else {
            // Soft delete: Set isActive to false
            const scanner = await prisma.scanner.update({
                where: { id },
                data: { isActive: false },
                select: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                    email: true
                }
            });

            return NextResponse.json({
                message: 'Scanner deactivated successfully',
                scanner
            }, { status: 200 });
        }

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({
                message: "Scanner not found"
            }, { status: 404 });
        }
        console.log("Error deleting scanner:", error);
        return NextResponse.json({
            message: "Failed to delete scanner"
        }, { status: 500 });
    }
};
