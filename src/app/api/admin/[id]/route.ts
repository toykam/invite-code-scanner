import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

type RouteParams = {
    params: Promise<{ id: string }>;
};

// PATCH update admin
export const PATCH = async (req: Request, { params }: RouteParams) => {
    try {
        const { id } = await params;
        const updateData = await req.json();

        // Don't allow changing id or createdAt
        delete updateData.id;
        delete updateData.createdAt;

        // Hash password if provided
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const admin = await prisma.admin.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true
            }
        });

        return NextResponse.json({
            message: 'Admin updated successfully',
            admin
        }, { status: 200 });

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({
                message: "Admin not found"
            }, { status: 404 });
        }
        console.log("Error updating admin:", error);
        return NextResponse.json({
            message: "Failed to update admin"
        }, { status: 500 });
    }
};

// DELETE admin (soft or hard delete)
export const DELETE = async (req: Request, { params }: RouteParams) => {
    try {
        const { id } = await params;
        const url = new URL(req.url);
        const permanent = url.searchParams.get("permanent") === "true";
        
        // Get current admin ID from request headers or body to prevent self-deletion
        const body = await req.json().catch(() => ({}));
        const currentAdminId = body.currentAdminId;

        if (currentAdminId && id === currentAdminId) {
            return NextResponse.json({
                message: "You cannot delete your own account"
            }, { status: 400 });
        }

        if (permanent) {
            // Hard delete: Permanently remove admin
            await prisma.admin.delete({
                where: { id }
            });

            return NextResponse.json({
                message: 'Admin permanently deleted'
            }, { status: 200 });
        } else {
            // Soft delete: Set isActive to false
            const admin = await prisma.admin.update({
                where: { id },
                data: { isActive: false },
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            });

            return NextResponse.json({
                message: 'Admin deactivated successfully',
                admin
            }, { status: 200 });
        }

    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({
                message: "Admin not found"
            }, { status: 404 });
        }
        console.log("Error deleting admin:", error);
        return NextResponse.json({
            message: "Failed to delete admin"
        }, { status: 500 });
    }
};
